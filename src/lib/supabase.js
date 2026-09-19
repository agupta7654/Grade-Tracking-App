import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

// detectSessionInUrl:false because Tally's own router uses window.location.hash
// for pages like #/course/123. We sign in with a typed 6-digit code
// (verifyOtp) rather than a clicked link, so there's no auth redirect for
// Supabase to parse out of the URL in the first place.
export const supabase = supabaseEnabled
  ? createClient(url, anonKey, {
      auth: { detectSessionInUrl: false },
    })
  : null;
