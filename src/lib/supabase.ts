import { createClient } from "@supabase/supabase-js";

export const supabaseProjectRef = "wtwilacirebkkddrooyj";

// VITE_* é injetado pelo build do Lovable. Os fallbacks são públicos.
export const supabaseUrl =
  import.meta.env['VITE_SUPABASE_URL'] ??
  `https://${supabaseProjectRef}.supabase.co`;
export const supabaseAnonKey =
  import.meta.env['VITE_SUPABASE_ANON_KEY'] ??
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2lsYWNpcmVia2tkZHJvb3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDE2MzIsImV4cCI6MjEwNTMxNzYzMn0.7d6TJhfVLaLr9vyQSR8Fwm0-IxRng6w1H7CmZKiJ2CI";

/** Indica se o cliente recebeu uma configuração pública válida. */
export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 0;

/** Instância única do cliente Supabase para toda a aplicação. */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
