import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Heart, LogOut, Package, Save, UserRound } from "lucide-react";
import { SiteNavigation } from "../components/site-navigation";
import { supabase } from "../lib/supabase";
import { updateProfile, type Profile } from "../lib/customer-account";

export const Route = createFileRoute("/conta")({ component: AccountPage });

function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      try {
        if (!supabase) throw new Error("O serviço de autenticação está indisponível.");
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          await navigate({ to: "/login", replace: true });
          return;
        }
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, role, is_active")
          .eq("id", auth.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (!active) return;
        const authName = typeof auth.user.user_metadata?.["full_name"] === "string" ? auth.user.user_metadata["full_name"] : "";
        const loadedProfile = profileData as Profile | null;
        setProfile(loadedProfile);
        setEmail(auth.user.email ?? "");
        setForm({ full_name: loadedProfile?.full_name?.trim() || authName, phone: loadedProfile?.phone ?? "" });
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Não foi possível carregar sua conta.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAccount();
    return () => { active = false; };
  }, [navigate]);

  async function save() {
    if (!form.full_name.trim()) { setMessage("Informe seu nome completo."); return; }
    setSaving(true); setMessage("");
    try {
      const updated = await updateProfile({ full_name: form.full_name.trim(), phone: form.phone.trim() });
      setProfile(updated);
      setMessage("Dados atualizados com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar seus dados.");
    } finally { setSaving(false); }
  }

  async function logout() {
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  }

  if (loading) return <div className="min-h-screen bg-background text-foreground"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8"><div className="animate-pulse space-y-4"><div className="h-12 w-2/3 rounded-lg bg-muted" /><div className="h-64 rounded-2xl bg-muted" /></div></main></div>;

  return <div className="min-h-screen bg-background pb-16 text-foreground md:pb-0"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
    <header className="mb-10 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Área exclusiva</p><h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Minha conta<span className="text-primary">.</span></h1><p className="mt-4 text-sm text-muted-foreground">Olá, {profile?.full_name || form.full_name || "cliente"} · {email}</p></div><button type="button" onClick={logout} disabled={signingOut} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-60"><LogOut size={16} />{signingOut ? "Saindo..." : "Sair"}</button></header>
    {message && <p role="status" className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary"><UserRound size={18} /></span><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Perfil</p><h2 className="text-2xl font-semibold">Meus dados</h2></div></div><div className="mt-7 space-y-5"><label className="block text-sm font-medium">Nome completo<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label><label className="block text-sm font-medium">E-mail<input value={email} readOnly aria-readonly="true" className="mt-2 h-12 w-full cursor-not-allowed rounded-xl border border-input bg-muted px-4 text-muted-foreground outline-none" /></label><label className="block text-sm font-medium">Telefone<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label><button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-60"><Save size={16} />{saving ? "Salvando..." : "Salvar dados"}</button></div></section>
      <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
        <AccountLink icon={<Package size={20} />} title="Meus endereços" description="Seus endereços salvos aparecerão aqui." disabled />
        <AccountLink icon={<Package size={20} />} title="Meus pedidos" description="Acompanhe suas compras e entregas." to="/conta" />
        <AccountLink icon={<Heart size={20} />} title="Meus favoritos" description="Revise as peças que você guardou." to="/favoritos" />
      </div>
    </div>
  </main></div>;
}

function AccountLink({ icon, title, description, to, disabled = false }: { icon: ReactNode; title: string; description: string; to?: "/conta" | "/favoritos"; disabled?: boolean }) {
  const content = <><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary">{icon}</span><span className="min-w-0"><span className="block text-lg font-semibold">{title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{description}</span></span><ArrowRight className="ml-auto shrink-0 text-primary" size={18} /></>;
  return disabled ? <article className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 opacity-70">{content}</article> : <Link to={to!} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-neon-soft">{content}</Link>;
}
