import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, MapPin, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteNavigation } from "../components/site-navigation";
import { supabase } from "../lib/supabase";
import { getCustomerAddresses, saveAddress, type Address } from "../lib/customer-account";

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
  const [cepStatus, setCepStatus] = useState("");
  const [lookingUpCep, setLookingUpCep] = useState(false);

  useEffect(() => {
    let active = true;
    getCustomerAddresses()
      .then((items) => { if (active) setAddresses(items); })
      .catch(async (error) => {
        if (!active) return;
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        if (!session) {
          void navigate({ to: "/login", replace: true });
          return;
        }
        setMessage(error instanceof Error ? error.message : "Não foi possível carregar seus endereços.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  function update(field: keyof AddressForm, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }

  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) { setCepStatus(cep.length ? "Digite um CEP com 8 números." : ""); return; }
    setLookingUpCep(true); setCepStatus("Consultando CEP...");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error("Falha na consulta");
      const data = await response.json();
      if (data.erro) { setCepStatus("CEP não encontrado. Você pode preencher o endereço manualmente."); return; }
      setForm((current) => ({ ...current, street: data.logradouro || current.street, neighborhood: data.bairro || current.neighborhood, city: data.localidade || current.city, state: data.uf || current.state }));
      setCepStatus("Endereço localizado. Confira os dados antes de salvar.");
    } catch { setCepStatus("Não foi possível consultar o CEP. Continue preenchendo manualmente."); }
    finally { setLookingUpCep(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const phoneDigits = form.phone.replace(/\D/g, "");
    const houseNumber = form.number.replace(/\D/g, "");
    const requiredFields = [form.recipient_name, form.street, houseNumber, form.city, form.state, form.postal_code];
    if (requiredFields.some((value) => !String(value ?? "").trim())) {
      setMessage("Preencha nome, rua, número, cidade, estado e CEP.");
      return;
    }
    if (form.postal_code.replace(/\D/g, "").length !== 8) {
      setMessage("Digite um CEP válido com 8 números.");
      return;
    }
    if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
      setMessage("Digite um telefone válido com 10 ou 11 números.");
      return;
    }
    setSaving(true); setMessage("");
    try {
      const payload: AddressForm = {
        label: form.label?.trim() || "Meu endereço",
        recipient_name: form.recipient_name?.trim() || "",
        phone: phoneDigits,
        street: form.street?.trim() || "",
        number: houseNumber,
        complement: form.complement?.trim() || "",
        neighborhood: form.neighborhood?.trim() || "",
        city: form.city?.trim() || "",
        state: form.state?.trim().toUpperCase() || "",
        postal_code: form.postal_code?.replace(/\D/g, "") || "",
        is_default: Boolean(form.is_default),
      };
      await saveAddress(payload);
      setForm(emptyForm);
      setCepStatus("");
      setMessage("Endereço salvo com sucesso.");
      try {
        const items = await getCustomerAddresses();
        setAddresses(items);
      } catch {
        // O cadastro já foi concluído; a atualização da lista não deve mascarar o sucesso.
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : "Confira os dados e tente novamente.";
      setMessage(`Não foi possível salvar o endereço. ${details}`);
    } finally { setSaving(false); }
  }
  const field = (key: keyof AddressForm, label: string, extra = "") => <label className={`block text-sm font-medium ${extra}`}>{label}<input value={String(form[key] ?? "")} onChange={(event) => { const rawValue = event.target.value; const value = key === "postal_code" ? rawValue.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2") : key === "phone" ? rawValue.replace(/\D/g, "").slice(0, 11) : key === "number" ? rawValue.replace(/\D/g, "").slice(0, 6) : rawValue; update(key, value); if (key === "postal_code") void lookupCep(value); }} inputMode={key === "postal_code" || key === "phone" || key === "number" ? "numeric" : undefined} maxLength={key === "postal_code" ? 9 : key === "phone" ? 11 : key === "number" ? 6 : undefined} placeholder={key === "phone" ? "Somente 10 ou 11 números" : undefined} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" />{key === "phone" && <span className="mt-2 block text-xs text-muted-foreground">Informe DDD + número: 10 ou 11 dígitos.</span>}{key === "postal_code" && <span role="status" className={`mt-2 block text-xs ${cepStatus.includes("localizado") ? "text-primary" : "text-muted-foreground"}`}>{lookingUpCep ? "Consultando CEP..." : cepStatus}</span>}</label>;

  if (loading) return <div className="min-h-screen bg-background text-foreground"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8"><div className="animate-pulse space-y-4"><div className="h-10 w-1/2 rounded-lg bg-muted" /><div className="h-96 rounded-2xl bg-muted" /></div></main></div>;
  return <div className="min-h-screen bg-background pb-16 text-foreground md:pb-0"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
    <Link to="/conta" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} />Voltar para minha conta</Link>
    <header className="mb-10 border-b border-border pb-8"><p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Entrega sem complicação</p><h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Meus endereços<span className="text-primary">.</span></h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">Cadastre onde suas compras devem chegar e escolha um endereço principal para agilizar o checkout.</p></header>
    {message && <p role="status" className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 md:p-8"><div className="mb-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary"><MapPin size={18} /></span><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Novo cadastro</p><h2 className="text-2xl font-semibold">Adicionar endereço</h2></div></div><div className="grid gap-5 sm:grid-cols-2">{field("label", "Apelido")} {field("recipient_name", "Nome de quem recebe")} {field("phone", "Telefone")} {field("postal_code", "CEP")} {field("street", "Rua", "sm:col-span-2")} {field("number", "Número")} {field("complement", "Complemento")} {field("neighborhood", "Bairro")} {field("city", "Cidade")} {field("state", "Estado / UF")} </div><label className="mt-6 flex items-center gap-3 text-sm"><input type="checkbox" checked={Boolean(form.is_default)} onChange={(event) => update("is_default", event.target.checked)} className="h-4 w-4 accent-primary" />Usar como endereço principal</label><button type="submit" disabled={saving} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-60"><Save size={16} />{saving ? "Salvando..." : "Salvar endereço"}</button></form>
      <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Salvos</h2><span className="text-sm text-muted-foreground">{addresses.length} {addresses.length === 1 ? "endereço" : "endereços"}</span></div>{addresses.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><MapPin className="mx-auto mb-4 text-primary" size={28} /><p className="font-medium">Você ainda não tem endereços.</p><p className="mt-2 text-sm text-muted-foreground">Preencha o formulário ao lado para cadastrar o primeiro.</p></div> : addresses.map((address) => <article key={address.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{address.label || "Meu endereço"}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{address.street}, {address.number}{address.complement ? ` · ${address.complement}` : ""}<br />{address.neighborhood} · {address.city} / {address.state}<br />CEP {address.postal_code}</p></div>{address.is_default && <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 px-2 py-1 text-xs text-primary"><Check size={12} />Principal</span>}</div></article>)}</section>
    </div>
  </main></div>;
}
