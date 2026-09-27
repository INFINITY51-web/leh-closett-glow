import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, CreditCard, RefreshCw, Settings2, ShoppingBag, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { listAdminCustomers, listSheinSyncRuns, loadAdminOperationalData, type AdminCustomer, type AdminOperationalData, type SupplierSyncRun } from "../lib/admin-operations";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const show = (value: unknown, fallback = "—") => value == null || value === "" ? fallback : String(value);
const date = (value: unknown) => value ? new Date(String(value)).toLocaleString("pt-BR") : "—";
const paid = (row: Record<string, unknown>) => ["paid", "approved", "pago", "confirmed"].includes(String(row.payment_status ?? row.status ?? "").toLowerCase());

function Status({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">Carregando dados reais...</div>;
  if (error) return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>;
  return null;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <article className="rounded-lg border border-border bg-card p-5"><Icon size={18} className="text-primary" /><p className="mt-4 text-xs uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></article>;
}

function Table({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  return <div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="p-4">{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index} className="border-b border-border last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-4">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="p-8 text-center text-muted-foreground">{empty}</td></tr>}</tbody></table></div>;
}

export function CustomersPanel() {
  const [rows, setRows] = useState<AdminCustomer[]>([]); const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { void listAdminCustomers().then(setRows).catch((reason) => setError(reason instanceof Error ? reason.message : "Não foi possível carregar clientes.")).finally(() => setLoading(false)); }, []);
  const filtered = rows.filter((row) => `${row.full_name ?? ""} ${row.email ?? ""} ${row.cpf ?? ""} ${row.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  if (loading || error) return <Status loading={loading} error={error} />;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><Metric icon={Users} label="Clientes cadastrados" value={String(rows.length)} /><Metric icon={ShoppingBag} label="Clientes com pedidos" value={String(rows.filter((row) => row.order_count > 0).length)} /><Metric icon={CreditCard} label="Receita por clientes" value={money(rows.reduce((sum, row) => sum + row.total_spent, 0))} /></div><label className="block max-w-xl text-sm font-medium">Buscar cliente<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, e-mail, CPF ou telefone" className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3" /></label>{selected && <section className="rounded-lg border border-primary/40 bg-card p-5"><div className="flex justify-between gap-4"><div><p className="text-xs uppercase text-primary">Cliente</p><h2 className="mt-1 text-2xl">{selected.full_name || "Nome não informado"}</h2></div><Button variant="ghost" onClick={() => setSelected(null)}>Fechar</Button></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><p>E-mail: {selected.email || "—"}</p><p>Telefone: {selected.phone || "—"}</p><p>CPF: {selected.cpf || "—"}</p><p>Pedidos: {selected.order_count} · {money(selected.total_spent)}</p></div><div className="mt-5 border-t border-border pt-4"><h3 className="font-medium">Endereços</h3>{selected.addresses.length ? selected.addresses.map((address, index) => <p key={String(address.id ?? index)} className="mt-2 text-sm text-muted-foreground">{[address.street, address.number, address.neighborhood, address.city, address.state, address.postal_code].filter(Boolean).map(String).join(", ")}</p>) : <p className="mt-2 text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>}</div></section>}<div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full min-w-[800px] text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="p-4">Cliente</th><th className="p-4">Contato</th><th className="p-4">Pedidos</th><th className="p-4">Total comprado</th><th className="p-4">Cadastro</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} onClick={() => setSelected(row)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"><td className="p-4 font-medium">{row.full_name || "Nome não informado"}<span className="block text-xs text-muted-foreground">{row.cpf || "CPF não informado"}</span></td><td className="p-4">{row.email || "—"}<span className="block text-xs text-muted-foreground">{row.phone || "Telefone não informado"}</span></td><td className="p-4">{row.order_count}</td><td className="p-4">{money(row.total_spent)}</td><td className="p-4">{date(row.created_at)}</td></tr>)}</tbody></table></div>{!filtered.length && <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}</div>;
}

function useOperations() {
  const [data, setData] = useState<AdminOperationalData>({ orders: [], payments: [], returns: [], refunds: [] }); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { void loadAdminOperationalData().then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados.")).finally(() => setLoading(false)); }, []);
  return { data, loading, error };
}

export function FinancePanel() {
  const { data, loading, error } = useOperations(); if (loading || error) return <Status loading={loading} error={error} />;
  const approved = data.payments.filter(paid); const approvedValue = approved.reduce((sum, row) => sum + Number(row.amount ?? row.transaction_amount ?? 0), 0); const refunded = data.refunds.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><Metric icon={CheckCircle2} label="Pagamentos aprovados" value={String(approved.length)} /><Metric icon={CreditCard} label="Receita confirmada" value={money(approvedValue)} /><Metric icon={RefreshCw} label="Reembolsos" value={money(refunded)} /></div><Table headers={["Pedido", "Status", "Valor", "Data"]} rows={data.payments.map((row) => [show(row.order_id ?? row.external_reference), show(row.status ?? row.payment_status), money(Number(row.amount ?? row.transaction_amount ?? 0)), date(row.created_at ?? row.updated_at)])} empty="Nenhum pagamento registrado." /></div>;
}

export function ReturnsPanel() {
  const { data, loading, error } = useOperations(); if (loading || error) return <Status loading={loading} error={error} />;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><Metric icon={RefreshCw} label="Solicitações" value={String(data.returns.length)} /><Metric icon={CreditCard} label="Reembolsos" value={String(data.refunds.length)} /><Metric icon={CheckCircle2} label="Concluídas" value={String(data.returns.filter((row) => ["completed", "approved"].includes(String(row.status))).length)} /></div><Table headers={["Pedido", "Motivo", "Status", "Data"]} rows={data.returns.map((row) => [show(row.order_id), show(row.reason), show(row.status), date(row.created_at)])} empty="Nenhuma devolução solicitada." /></div>;
}

export function AnalyticsPanel() {
  const { data, loading, error } = useOperations();
  const stats = useMemo(() => { const paidOrders = data.orders.filter(paid); const revenue = paidOrders.reduce((sum, row) => sum + Number(row.total ?? 0), 0); const quantities = new Map<string, number>(); data.orders.forEach((order) => (Array.isArray(order.order_items) ? order.order_items as Array<Record<string, unknown>> : []).forEach((item) => quantities.set(show(item.product_name, "Produto"), (quantities.get(show(item.product_name, "Produto")) ?? 0) + Number(item.quantity ?? 0)))); return { paidOrders, revenue, products: [...quantities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8) }; }, [data]);
  if (loading || error) return <Status loading={loading} error={error} />;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-4"><Metric icon={ShoppingBag} label="Pedidos" value={String(data.orders.length)} /><Metric icon={CheckCircle2} label="Pedidos pagos" value={String(stats.paidOrders.length)} /><Metric icon={CreditCard} label="Receita" value={money(stats.revenue)} /><Metric icon={BarChart3} label="Ticket médio" value={money(stats.paidOrders.length ? stats.revenue / stats.paidOrders.length : 0)} /></div><section className="rounded-lg border border-border bg-card p-5"><h2 className="text-xl">Produtos mais vendidos</h2>{stats.products.length ? <div className="mt-5 space-y-3">{stats.products.map(([name, quantity], index) => <div key={name} className="flex justify-between border-b border-border pb-3 text-sm"><span>{index + 1}. {name}</span><strong>{quantity} un.</strong></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Os resultados aparecerão após os primeiros pedidos.</p>}</section></div>;
}

export function SettingsPanel() { return <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-lg border border-border bg-card p-5"><Settings2 className="text-primary" /><h2 className="mt-4 text-xl">Operação conectada</h2><p className="mt-2 text-sm text-muted-foreground">Catálogo, pedidos, clientes, estoque, conteúdo e arquivos usam os registros da loja.</p></section><section className="rounded-lg border border-border bg-card p-5"><CheckCircle2 className="text-primary" /><h2 className="mt-4 text-xl">Acesso protegido</h2><p className="mt-2 text-sm text-muted-foreground">A área administrativa exige uma conta ativa com permissão de administradora.</p></section></div>; }

export function SheinIntegrationPanel() {
  const [runs, setRuns] = useState<SupplierSyncRun[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { void listSheinSyncRuns().then(setRuns).catch((reason) => setError(reason instanceof Error ? reason.message : "Não foi possível consultar sincronizações.")).finally(() => setLoading(false)); }, []); const latest = runs[0];
  return <section className="rounded-lg border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase text-primary">Integração de fornecedor</p><h2 className="mt-1 text-2xl">Shein</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Produtos, variantes e estoque poderão ser vinculados aos identificadores oficiais da sua conta.</p></div><Badge variant={latest?.status === "success" ? "default" : "outline"}>{latest ? show(latest.status) : "Aguardando credenciais"}</Badge></div>{loading ? <p className="mt-5 text-sm text-muted-foreground">Verificando a integração...</p> : error ? <p className="mt-5 flex items-center gap-2 text-sm text-destructive"><AlertCircle size={16} />{error}</p> : <div className="mt-5 grid gap-4 sm:grid-cols-3"><p className="text-sm">Última sincronização<br /><strong>{latest ? date(latest.finished_at ?? latest.started_at) : "Nunca realizada"}</strong></p><p className="text-sm">Itens processados<br /><strong>{latest?.items_processed ?? 0}</strong></p><p className="text-sm">Situação<br /><strong>{latest ? show(latest.status) : "Estrutura pronta"}</strong></p></div>}<div className="mt-6 border-t border-border pt-5"><Button disabled>Conectar credenciais da Shein</Button><p className="mt-2 text-xs text-muted-foreground">Será liberado quando as credenciais oficiais forem adicionadas com segurança.</p></div></section>;
}