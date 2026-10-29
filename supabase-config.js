// Add your Supabase project URL and publishable anon key here.
// These browser credentials are public; never put a service_role key in this file.
window.VAULTLY_SUPABASE_CONFIG = {
  url: "https://yfglkplavdaovzilrqhg.supabase.co",
  anonKey: "sb_publishable_UHR69nAb-bP2Ita-9d9wRw_pG8u-gb0",
};

(function () {
  "use strict";

  var config = window.VAULTLY_SUPABASE_CONFIG;
  var SUPABASE_URL = config && config.url;
  var SUPABASE_ANON_KEY = config && config.anonKey;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    window.vaultlySupabase = null;
    window.vaultlySupabaseError = "Add your Supabase project URL and publishable anon key in supabase-config.js.";
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    window.vaultlySupabase = null;
    window.vaultlySupabaseError = "The Supabase client library did not load. Check your internet connection and reload.";
    return;
  }

  try {
    window.vaultlySupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        flowType: "pkce",
      },
    });
    window.vaultlySupabaseError = "";
  } catch (error) {
    window.vaultlySupabase = null;
    window.vaultlySupabaseError = "Supabase configuration is invalid. Check the project URL and publishable anon key.";
  }
})();
