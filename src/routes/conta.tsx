import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Heart, LogOut, MapPin, Package, Save, UserRound } from "lucide-react";
import { SiteNavigation } from "../components/site-navigation";
import { supabase } from "../lib/supabase";
import { formatCpf, formatPhone, isValidCpf, isValidPhone, listCustomerOrders, type CustomerOrder, updateProfile, type Profile } from "../lib/customer-account";

export const Route = createFileRoute("/conta")({ component: AccountPage });

function AccountPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ full_name: "", cpf: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const selectedOrder = orders.find((item) => item.id === String(search.order ?? ""));

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      try {
        if (!supabase) throw new Error("O serviço de autenticação está indisponível.");
        const sessionResult = await supabase.auth.getSession();
        const user = sessionResult.data.session?.user ?? (await supabase.auth.getUser()).data.user;
        if (!user) {
          await navigate({ to: "/login", replace: true });
          return;
        }
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, cpf, phone, role, is_active")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        const authName = typeof user.user_metadata?.["full_name"] === "string" ? user.user_metadata["full_name"] : "";
        // A sessão válida já garante o acesso à área privada. Se o perfil
        // ainda não estiver visível pela RLS, usamos os dados do Auth sem
        // exibir um erro que contradiz o acesso bem-sucedido.
        const loadedProfile = profileError ? null : profileData as Profile | null;
        setMessage("");
        setProfile(loadedProfile);
        setEmail(user.email ?? "");
        setForm({ full_name: loadedProfile?.full_name?.trim() || authName, cpf: formatCpf(loadedProfile?.cpf ?? ""), phone: formatPhone(loadedProfile?.phone ?? "") });
        try { setOrders(await listCustomerOrders()); } catch (error) { setOrdersError(error instanceof Error ? error.message : "Não foi possível carregar seus pedidos."); } finally { setOrdersLoading(false); }
      } catch (error) {
        if (active) { setMessage(error instanceof Error ? error.message : "Não foi possível validar seu acesso."); setOrdersLoading(false); }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAccount();
    return () => { active = false; };
  }, [navigate]);

  async function save() {
    if (!form.full_name.trim()) { setMessage("Informe seu nome completo."); return; }
    if (!isValidCpf(form.cpf)) { setMessage("Informe um CPF válido."); return; }
    if (form.phone.trim() && !isValidPhone(form.phone)) { setMessage("Informe um telefone válido com 10 ou 11 números."); return; }
    setSaving(true); setMessage("");
    try {
      const updated = await updateProfile({ full_name: form.full_name.trim(), cpf: form.cpf.replace(/\D/g, ""), phone: form.phone.replace(/\D/g, "") });
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
    for (const key of ["leh-supabase-cart-id", "leh-created-order", "leh-checkout-review", "leh-checkout-address-id"]) sessionStorage.removeItem(key);
    await navigate({ to: "/login", replace: true });
  }

  if (loading) return <div className="min-h-screen bg-background text-foreground"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8"><div className="animate-pulse space-y-4"><div className="h-12 w-2/3 rounded-lg bg-muted" /><div className="h-64 rounded-2xl bg-muted" /></div></main></div>;

  return <div className="min-h-screen bg-background pb-16 text-foreground md:pb-0"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
    <header className="mb-10 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Área exclusiva</p><h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Minha conta<span className="text-primary">.</span></h1><p className="mt-4 text-sm text-muted-foreground">Olá, {profile?.full_name || form.full_name || "cliente"} · {email}</p></div><button type="button" onClick={logout} disabled={signingOut} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-60"><LogOut size={16} />{signingOut ? "Saindo..." : "Sair"}</button></header>
    {message && <p role="status" className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary"><UserRound size={18} /></span><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Perfil</p><h2 className="text-2xl font-semibold">Meus dados</h2></div></div><div className="mt-7 space-y-5"><label className="block text-sm font-medium">Nome completo<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label><label className="block text-sm font-medium">CPF<input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })} inputMode="numeric" maxLength={14} placeholder="000.000.000-00" className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label><label className="block text-sm font-medium">E-mail<input value={email} readOnly aria-readonly="true" className="mt-2 h-12 w-full cursor-not-allowed rounded-xl border border-input bg-muted px-4 text-muted-foreground outline-none" /></label><label className="block text-sm font-medium">Telefone<input type="tel" inputMode="numeric" maxLength={15} placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label><button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-60"><Save size={16} />{saving ? "Salvando..." : "Salvar dados"}</button></div></section>
      {selectedOrder && <section className="mt-8 rounded-2xl border border-primary/30 bg-card p-6 md:p-8"><p className="text-xs uppercase tracking-[0.2em] text-primary">Detalhes do pedido</p><h2 className="mt-2 text-2xl font-semibold">{selectedOrder.order_number ?? selectedOrder.id}</h2><div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><p>Status: {selectedOrder.status ?? "Em atualização"}</p><p>Pagamento: {selectedOrder.payment_status ?? "Pendente"}</p><p>Entrega: {selectedOrder.shipping_status ?? "Em preparação"}</p></div>{selectedOrder.order_items?.length ? <div className="mt-6 divide-y divide-border">{selectedOrder.order_items.map((item, index) => <div key={String(item.id ?? index)} className="flex justify-between gap-4 py-3"><span>{String(item.product_name ?? item.name ?? "Produto")} · qtd. {String(item.quantity ?? 1)}{item.variant_name ? ` · ${String(item.variant_name)}` : ""}</span><span>{item.total != null ? `R$ ${Number(item.total).toFixed(2).replace(".", ",")}` : ""}</span></div>)}</div> : null}{selectedOrder.shipments?.length ? <div className="mt-6 rounded-xl border border-border p-4 text-sm"><strong>Rastreio</strong><p className="mt-2 text-muted-foreground">{String(selectedOrder.shipments[0].carrier ?? "Transportadora")} · {String(selectedOrder.shipments[0].service ?? "")}</p><p>{String(selectedOrder.shipments[0].tracking_code ?? "Sem código informado")} · {String(selectedOrder.shipments[0].status ?? "Em preparação")}</p></div> : <p className="mt-6 text-sm text-muted-foreground">A entrega ainda está em preparação.</p>}</section>}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary"><Package size={18} /></span><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Histórico</p><h2 className="text-2xl font-semibold">Meus pedidos</h2></div></div>{ordersError && <p role="alert" className="mt-5 text-sm text-destructive">{ordersError}</p>}{ordersLoading ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-muted" /> : orders.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Você ainda não tem pedidos.</p> : <div className="mt-6 divide-y divide-border">{orders.map((order) => <Link key={order.id} to="/conta" search={{ order: order.id } as never} className="flex flex-wrap items-center justify-between gap-3 py-4 transition hover:text-primary"><span><strong>{order.order_number ?? order.id}</strong><span className="ml-3 text-sm text-muted-foreground">{order.created_at ? new Date(order.created_at).toLocaleDateString("pt-BR") : ""}</span></span><span className="text-sm">{order.status ?? "Em atualização"} · {order.payment_status ?? "Pagamento pendente"} · {order.total != null ? `R$ ${Number(order.total).toFixed(2).replace(".", ",")}` : ""}</span></Link>)}</div>}</section>
      <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
        <AccountLink icon={<MapPin size={20} />} title="Meus endereços" description="Gerencie seus endereços de entrega." to="/enderecos" />
        <AccountLink icon={<Package size={20} />} title="Meus pedidos" description="Acompanhe suas compras e entregas." to="/conta" />
        <AccountLink icon={<Heart size={20} />} title="Meus favoritos" description="Revise as peças que você guardou." to="/favoritos" />
      </div>
    </div>
  </main></div>;
}

function AccountLink({ icon, title, description, to, disabled = false }: { icon: ReactNode; title: string; description: string; to?: "/conta" | "/favoritos" | "/enderecos"; disabled?: boolean }) {
  const content = <><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary">{icon}</span><span className="min-w-0"><span className="block text-lg font-semibold">{title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{description}</span></span><ArrowRight className="ml-auto shrink-0 text-primary" size={18} /></>;
  return disabled ? <article className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 opacity-70">{content}</article> : <Link to={to!} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-neon-soft">{content}</Link>;
}
