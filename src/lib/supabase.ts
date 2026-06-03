import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase-config";

const config = getSupabaseConfig();

if (!config.url) {
  console.warn("Supabase URL is not configured. Falling back to local storage.");
}

// Initialize Supabase Client. Use Service Role Key for server-side bypass of RLS,
// fallback to Anon Key if Service Role Key is not available.
export const supabase = createClient(
  config.url || "https://placeholder-url.supabase.co",
  config.serviceRoleKey || config.anonKey || "placeholder-anon-key"
);
