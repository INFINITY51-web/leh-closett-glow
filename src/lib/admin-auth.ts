import { supabase } from "./supabase";

export type AdminSession = { id: string; email: string };

async function getAdminProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) return null;
  const profile = await getAdminProfile(session.user.id);
  if (profile?.role !== "admin" || profile.is_active !== true) return null;
  return { id: session.user.id, email: session.user.email ?? "" };
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error("E-mail ou senha inválidos.");
  const profile = await getAdminProfile(data.user.id);
  if (profile?.role !== "admin" || profile.is_active !== true) {
    await supabase.auth.signOut();
    throw new Error("Este usuário não possui acesso administrativo ativo.");
  }
  return { id: data.user.id, email: data.user.email ?? email };
}

export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
