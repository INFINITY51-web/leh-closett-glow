import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Supplier = {
  id: string;
  name: string;
  country: string | null;
  internal_code: string | null;
  is_active: boolean;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  integration_type: string | null;
  integration_identifier: string | null;
  integration_status: string | null;
  last_synchronization: string | null;
  supplier_order_data: string | null;
  shipping_data: string | null;
  internal_notes: string | null;
};

type SupplierForm = Omit<Supplier, "id">;

const empty: SupplierForm = {
  name: "", country: "", internal_code: "", is_active: true,
  address: "", city: "", state: "", postal_code: "",
  contact_name: "", contact_phone: "", contact_email: "",
  integration_type: "", integration_identifier: "", integration_status: "not_configured",
  last_synchronization: null, supplier_order_data: "", shipping_data: "", internal_notes: "",
};

const inputClass = "mt-2 h-10 w-full rounded-lg border border-input bg-background px-3";
const textareaClass = "mt-2 w-full rounded-lg border border-input bg-background p-3";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{label}{children}</label>;
}

export function AdminSuppliers() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierForm>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!supabase) { setError("Supabase não está configurado."); setLoading(false); return; }
    const { data, error: requestError } = await supabase.from("suppliers").select("*").order("name");
    if (requestError) setError("Não foi possível carregar os fornecedores. Verifique a tabela suppliers.");
    else setRows((data || []) as Supplier[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  function edit(row?: Supplier) {
    setEditing(row?.id || null);
    setForm(row ? { ...row } : { ...empty });
    setOpen(true);
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !form.name.trim()) return;
    try {
      setSaving(true);
      setError("");
      const payload = { ...form, name: form.name.trim(), last_synchronization: form.last_synchronization || null };
      const result = editing
        ? await supabase.from("suppliers").update(payload).eq("id", editing).select().single()
        : await supabase.from("suppliers").insert(payload).select().single();
      if (result.error) throw result.error;
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar o fornecedor.");
    } finally { setSaving(false); }
  }

  const update = (key: keyof SupplierForm, value: string | boolean | null) => setForm((current) => ({ ...current, [key]: value }));
  const integrationLabel = (value: string | null) => ({ not_configured: "Não configurada", pending: "Pendente", connected: "Conectada", error: "Erro" }[value || ""] || value || "Não configurada");
  const filtered = rows.filter((row) => `${row.name} ${row.country || ""} ${row.city || ""} ${row.contact_name || ""} ${row.contact_email || ""}`.toLowerCase().includes(query.toLowerCase()) && (status === "all" || (status === "active" ? row.is_active : !row.is_active)));

  return <div className="mt-8 space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><p className="text-sm text-muted-foreground">Gestão e conexão operacional</p><h2 className="mt-1 text-2xl font-semibold">Fornecedores</h2></div>
      <button type="button" onClick={() => edit()} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">Adicionar fornecedor</button>
    </div>

    {open && <form onSubmit={save} className="space-y-6 rounded-xl border border-primary/40 bg-card p-5">
      <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Cadastro</p><h3 className="mt-1 text-xl font-semibold">{editing ? "Editar fornecedor" : "Novo fornecedor"}</h3></div><button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Fechar</button></div>

      <section className="space-y-4 border-b border-border pb-6"><h4 className="text-lg font-semibold">1. Dados do fornecedor</h4><div className="grid gap-4 md:grid-cols-2"><Field label="Nome do fornecedor"><input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} /></Field><Field label="País"><input value={form.country || ""} onChange={(e) => update("country", e.target.value)} className={inputClass} /></Field><Field label="Identificação interna (uso administrativo)"><input aria-label="Identificação interna para uso administrativo" value={form.internal_code || ""} onChange={(e) => update("internal_code", e.target.value)} className={inputClass} /></Field><label className="flex items-center gap-2 self-end pb-2 text-sm font-medium"><input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} />Fornecedor ativo</label></div></section>

      <section className="space-y-4 border-b border-border pb-6"><h4 className="text-lg font-semibold">2. Endereço de origem</h4><div className="grid gap-4 md:grid-cols-2"><Field label="Endereço" className="md:col-span-2"><input value={form.address || ""} onChange={(e) => update("address", e.target.value)} className={inputClass} /></Field><Field label="Cidade"><input value={form.city || ""} onChange={(e) => update("city", e.target.value)} className={inputClass} /></Field><Field label="Estado"><input value={form.state || ""} onChange={(e) => update("state", e.target.value)} className={inputClass} /></Field><Field label="CEP"><input value={form.postal_code || ""} onChange={(e) => update("postal_code", e.target.value)} className={inputClass} /></Field></div></section>

      <section className="space-y-4 border-b border-border pb-6"><h4 className="text-lg font-semibold">3. Contato</h4><div className="grid gap-4 md:grid-cols-3"><Field label="Nome do contato"><input value={form.contact_name || ""} onChange={(e) => update("contact_name", e.target.value)} className={inputClass} /></Field><Field label="Telefone"><input type="tel" value={form.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)} className={inputClass} /></Field><Field label="E-mail"><input type="email" value={form.contact_email || ""} onChange={(e) => update("contact_email", e.target.value)} className={inputClass} /></Field></div></section>

      <section className="space-y-4 border-b border-border pb-6"><h4 className="text-lg font-semibold">4. Integração</h4><div className="grid gap-4 md:grid-cols-2"><Field label="Tipo de integração"><input value={form.integration_type || ""} onChange={(e) => update("integration_type", e.target.value)} className={inputClass} /></Field><Field label="Identificação da integração"><input value={form.integration_identifier || ""} onChange={(e) => update("integration_identifier", e.target.value)} className={inputClass} /></Field><Field label="Status da integração"><select value={form.integration_status || "not_configured"} onChange={(e) => update("integration_status", e.target.value)} className={inputClass}><option value="not_configured">Não configurada</option><option value="pending">Pendente</option><option value="connected">Conectada</option><option value="error">Erro</option></select></Field><Field label="Última sincronização"><input type="datetime-local" value={form.last_synchronization ? form.last_synchronization.slice(0, 16) : ""} onChange={(e) => update("last_synchronization", e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputClass} /></Field></div></section>

      <section className="space-y-4"><h4 className="text-lg font-semibold">5. Operação</h4><div className="grid gap-4 md:grid-cols-3"><Field label="Dados para pedidos ao fornecedor"><textarea rows={5} value={form.supplier_order_data || ""} onChange={(e) => update("supplier_order_data", e.target.value)} className={textareaClass} /></Field><Field label="Dados para cálculo de frete"><textarea rows={5} value={form.shipping_data || ""} onChange={(e) => update("shipping_data", e.target.value)} className={textareaClass} /></Field><Field label="Observações internas"><textarea rows={5} value={form.internal_notes || ""} onChange={(e) => update("internal_notes", e.target.value)} className={textareaClass} /></Field></div></section>

      {error && <p className="text-sm text-destructive">{error}</p>}<button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar fornecedor"}</button>
    </form>}

    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_12rem]"><Field label="Buscar fornecedor"><input aria-label="Buscar fornecedor" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, país ou contato" className={inputClass} /></Field><Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></Field></div>
    <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"><tr>{["Fornecedor", "País", "Cidade / estado", "Contato", "Status", "Integração"].map((title) => <th key={title} className="p-4">{title}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando fornecedores...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum fornecedor encontrado.</td></tr> : filtered.map((row) => <tr key={row.id} tabIndex={0} role="button" onClick={() => edit(row)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") edit(row); }} className="cursor-pointer border-b border-border hover:bg-muted/50 last:border-0"><td className="p-4 font-medium text-primary">{row.name}</td><td className="p-4">{row.country || "—"}</td><td className="p-4">{[row.city, row.state].filter(Boolean).join(" / ") || "—"}</td><td className="p-4">{row.contact_name || row.contact_email || row.contact_phone || "Não informado"}</td><td className="p-4"><span className={row.is_active ? "text-primary" : "text-muted-foreground"}>{row.is_active ? "Ativo" : "Inativo"}</span></td><td className="p-4">{integrationLabel(row.integration_status)}</td></tr>)}</tbody></table></div>
  </div>;
}
