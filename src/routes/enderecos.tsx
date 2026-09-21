import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, MapPin, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteNavigation } from "../components/site-navigation";
import { getCustomerAccount, saveAddress, type Address } from "../lib/customer-account";

export const Route = createFileRoute("/enderecos")({ component: AddressesPage });

type AddressForm = Omit<Address, "id">;
const emptyForm: AddressForm = { label: "", recipient_name: "", phone: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", postal_code: "", is_default: false };

function AddressesPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getCustomerAccount().then((account) => { if (active) setAddresses(account.addresses); }).catch(() => { void navigate({ to: "/login", replace: true }); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  function update(field: keyof AddressForm, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.recipient_name?.trim() || !form.street?.trim() || !form.number?.trim() || !form.city?.trim() || !form.state?.trim() || !form.postal_code?.trim()) { setMessage("Preencha nome, rua, número, cidade, estado e CEP."); return; }
    setSaving(true); setMessage("");
    try { await saveAddress({ ...form, label: form.label?.trim() || "Meu endereço" }); const account = await getCustomerAccount(); setAddresses(account.addresses); setForm(emptyForm); setMessage("Endereço salvo com sucesso."); } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar o endereço."); } finally { setSaving(false); }
  }
  const field = (key: keyof AddressForm, label: string, extra = "") => <label className={`block text-sm font-medium ${extra}`}>{label}<input required={!["label", "phone", "complement"].includes(key)} value={String(form[key] ?? "")} onChange={(event) => update(key, event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label>;

  if (loading) return <div className="min-h-screen bg-background text-foreground"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8"><div className="animate-pulse space-y-4"><div className="h-10 w-1/2 rounded-lg bg-muted" /><div className="h-96 rounded-2xl bg-muted" /></div></main></div>;
  return <div className="min-h-screen bg-background pb-16 text-foreground md:pb-0"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
    <Link to="/conta" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} />Voltar para minha conta</Link>
    <header className="mb-10 border-b border-border pb-8"><p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Entrega sem complicação</p><h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Meus endereços<span className="text-primary">.</span></h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">Cadastre onde suas compras devem chegar e escolha um endereço principal para agilizar o checkout.</p></header>
    {message && <p role="status" className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 md:p-8"><div className="mb-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary"><MapPin size={18} /></span><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Novo cadastro</p><h2 className="text-2xl font-semibold">Adicionar endereço</h2></div></div><div className="grid gap-5 sm:grid-cols-2">{field("label", "Apelido")} {field("recipient_name", "Nome de quem recebe")} {field("phone", "Telefone")} {field("postal_code", "CEP")} {field("street", "Rua", "sm:col-span-2")} {field("number", "Número")} {field("complement", "Complemento")} {field("neighborhood", "Bairro")} {field("city", "Cidade")} {field("state", "Estado / UF")} </div><label className="mt-6 flex items-center gap-3 text-sm"><input type="checkbox" checked={Boolean(form.is_default)} onChange={(event) => update("is_default", event.target.checked)} className="h-4 w-4 accent-primary" />Usar como endereço principal</label><button disabled={saving} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-60"><Save size={16} />{saving ? "Salvando..." : "Salvar endereço"}</button></form>
      <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Salvos</h2><span className="text-sm text-muted-foreground">{addresses.length} {addresses.length === 1 ? "endereço" : "endereços"}</span></div>{addresses.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><MapPin className="mx-auto mb-4 text-primary" size={28} /><p className="font-medium">Você ainda não tem endereços.</p><p className="mt-2 text-sm text-muted-foreground">Preencha o formulário ao lado para cadastrar o primeiro.</p></div> : addresses.map((address) => <article key={address.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{address.label || "Meu endereço"}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{address.street}, {address.number}{address.complement ? ` · ${address.complement}` : ""}<br />{address.neighborhood} · {address.city} / {address.state}<br />CEP {address.postal_code}</p></div>{address.is_default && <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 px-2 py-1 text-xs text-primary"><Check size={12} />Principal</span>}</div></article>)}</section>
    </div>
  </main></div>;
}
