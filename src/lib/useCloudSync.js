import { useEffect, useRef, useState } from 'react';

const CODE_KEY = 'tally:v1:syncCode';
const ENDPOINT = '/api/sync';
// Excludes look-alike characters (0/O, 1/I/L) so codes are easy to read and type.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode() {
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}

function loadCode() {
  let c = localStorage.getItem(CODE_KEY);
  if (!c) {
    c = randomCode();
    localStorage.setItem(CODE_KEY, c);
  }
  return c;
}

async function fetchRemote(code) {
  const res = await fetch(`${ENDPOINT}?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error('sync server error');
  return res.json(); // { data, updatedAt } or null
}

async function pushRemote(code, data, updatedAt) {
  const res = await fetch(`${ENDPOINT}?code=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data, updatedAt }),
  });
  if (!res.ok) throw new Error('sync server error');
}

export function useCloudSync({ data, updatedAt, adoptRemote }) {
  const [code, setCode] = useState(loadCode);
  const [status, setStatus] = useState('syncing');
  const reconciled = useRef(false);
  const codeRef = useRef(code);
  codeRef.current = code;

  // Whenever the code changes (first load, or the person just linked a
  // different device's code), figure out whether the local or remote copy
  // is newer and reconcile once before allowing routine pushes.
  useEffect(() => {
    let cancelled = false;
    reconciled.current = false;
    setStatus('syncing');
    (async () => {
      try {
        const row = await fetchRemote(code);
        if (cancelled) return;
        const remoteStamp = row?.updatedAt || 0;
        if (row && remoteStamp > updatedAt) {
          adoptRemote(row.data, remoteStamp);
        } else {
          await pushRemote(code, data, updatedAt || Date.now());
        }
        reconciled.current = true;
        setStatus('synced');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // After that: push local edits, debounced.
  useEffect(() => {
    if (!reconciled.current) return;
    setStatus('syncing');
    const t = setTimeout(async () => {
      try {
        await pushRemote(code, data, updatedAt);
        setStatus('synced');
      } catch {
        setStatus('error');
      }
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, updatedAt, code]);

  // Pull in case the other device wrote something while this tab was in the background.
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== 'visible' || !reconciled.current) return;
      try {
        const row = await fetchRemote(codeRef.current);
        const remoteStamp = row?.updatedAt || 0;
        if (row && remoteStamp > updatedAt) adoptRemote(row.data, remoteStamp);
      } catch {
        /* offline or blip; the next edit or focus will retry */
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedAt]);

  // Called when the person types in a code from their other device.
  const linkCode = (newCode) => {
    const cleaned = newCode.trim().toUpperCase();
    if (!cleaned || cleaned === code) return;
    localStorage.setItem(CODE_KEY, cleaned);
    setCode(cleaned);
  };

  return { enabled: true, code, status, linkCode };
}
