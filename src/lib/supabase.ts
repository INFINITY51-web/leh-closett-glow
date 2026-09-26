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
const hasValidSupabaseUrl = /^https:\/\/[^\s/]+\.supabase\.co(?:\/.+)?$/.test(supabaseUrl);
const hasValidSupabaseKey = supabaseAnonKey.startsWith("eyJ") && supabaseAnonKey.length > 100;

export const isSupabaseConfigured = hasValidSupabaseUrl && hasValidSupabaseKey;

/** Retorna uma mensagem acionável sem expor a chave pública. */
export function getSupabaseConfigurationError() {
  if (!hasValidSupabaseUrl) return "Supabase não configurado: VITE_SUPABASE_URL está ausente ou inválida.";
  if (!hasValidSupabaseKey) return "Supabase não configurado: VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY está ausente ou inválida.";
  return null;
}

export function requireSupabase() {
  if (!supabase) throw new Error(getSupabaseConfigurationError() ?? "Supabase não configurado.");
  return supabase;
}

/** Instância única do cliente Supabase para toda a aplicação. */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
