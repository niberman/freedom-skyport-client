import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Force Lovable & local to use the real Freedom Aviation project
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  (globalThis as any).VITE_SUPABASE_URL ||
  "https://wsepwuxkwjnsgmkddkjw.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (globalThis as any).VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI";

// Create the client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// TEMP: log which project Lovable is hitting
console.info("[Supabase URL]", SUPABASE_URL);
