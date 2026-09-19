import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

// PKCE + detectSessionInUrl:false because Tally's own router already uses
// window.location.hash for pages like #/course/123. Supabase's default
// (implicit) flow also returns tokens in the URL hash, which would collide
// with that router. PKCE returns a `?code=` query param instead, which we
// exchange manually in useCloudSync.js.
export const supabase = supabaseEnabled
  ? createClient(url, anonKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: false },
    })
  : null;
