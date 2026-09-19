import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseEnabled } from './supabase';

const TABLE = 'tally_data';

export function useCloudSync({ data, updatedAt, adoptRemote }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(supabaseEnabled ? 'signedout' : 'disabled');
  const reconciled = useRef(false);

  useEffect(() => {
    if (!supabaseEnabled) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      reconciled.current = false;
      setUser(session?.user ?? null);
      if (!session?.user) setStatus('signedout');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Once, right after sign-in: whichever of local/cloud is newer wins.
  useEffect(() => {
    if (!supabaseEnabled || !user || reconciled.current) return;
    let cancelled = false;
    setStatus('syncing');
    (async () => {
      const { data: row, error } = await supabase
        .from(TABLE)
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        reconciled.current = true;
        setStatus('error');
        return;
      }
      const remoteStamp = row ? new Date(row.updated_at).getTime() : 0;
      if (row && remoteStamp > updatedAt) {
        adoptRemote(row.data, remoteStamp);
      } else {
        await supabase
          .from(TABLE)
          .upsert({ user_id: user.id, data, updated_at: new Date(updatedAt || Date.now()).toISOString() });
      }
      reconciled.current = true;
      setStatus('synced');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // After that: push local edits to the cloud, debounced.
  useEffect(() => {
    if (!supabaseEnabled || !user || !reconciled.current) return;
    setStatus('syncing');
    const t = setTimeout(async () => {
      const { error } = await supabase
        .from(TABLE)
        .upsert({ user_id: user.id, data, updated_at: new Date(updatedAt).toISOString() });
      setStatus(error ? 'error' : 'synced');
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, updatedAt, user]);

  // Pull in case the other device wrote something while this tab was in the background.
  useEffect(() => {
    if (!supabaseEnabled || !user) return;
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: row, error } = await supabase
        .from(TABLE)
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && row) {
        const remoteStamp = new Date(row.updated_at).getTime();
        if (remoteStamp > updatedAt) adoptRemote(row.data, remoteStamp);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, updatedAt]);

  const signIn = async (email) => {
    if (!supabaseEnabled) return { error: new Error('Supabase is not configured for this deploy.') };
    return supabase.auth.signInWithOtp({ email });
  };

  const verifyCode = async (email, token) => {
    if (!supabaseEnabled) return { error: new Error('Supabase is not configured for this deploy.') };
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  };

  const signOut = () => supabase?.auth.signOut();

  return { enabled: supabaseEnabled, user, status, signIn, verifyCode, signOut };
}
