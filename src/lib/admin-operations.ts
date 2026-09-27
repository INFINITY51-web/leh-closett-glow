import { supabase } from "./supabase";

export type AdminCustomer = {
  id: string;
  email: string | null;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  addresses: Array<Record<string, unknown>>;
  order_count: number;
  total_spent: number;
};

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  if (!supabase) throw new Error("Banco de dados não configurado.");
  const [profiles, orders] = await Promise.all([
    supabase.from("profiles").select("id, full_name, cpf, phone, is_active, created_at, addresses(*)"),
    supabase.from("orders").select("user_id, customer_email, total"),
  ]);
  if (profiles.error) throw profiles.error;
  if (orders.error) throw orders.error;
  const stats = new Map<string, { count: number; total: number; email: string | null }>();
  (orders.data ?? []).forEach((order) => {
    const key = String(order.user_id ?? order.customer_email ?? "");
    if (!key) return;
    const current = stats.get(key) ?? { count: 0, total: 0, email: null };
    stats.set(key, { count: current.count + 1, total: current.total + Number(order.total ?? 0), email: current.email ?? (order.customer_email ? String(order.customer_email) : null) });
  });
  return (profiles.data ?? []).map((row: Record<string, unknown>) => {
    const customerStats = stats.get(String(row.id)) ?? stats.get(String(row.email ?? "")) ?? { count: 0, total: 0 };
    return {
      id: String(row.id), email: customerStats.email,
      full_name: row.full_name == null ? null : String(row.full_name), cpf: row.cpf == null ? null : String(row.cpf),
      phone: row.phone == null ? null : String(row.phone), is_active: Boolean(row.is_active),
      created_at: String(row.created_at), addresses: Array.isArray(row.addresses) ? row.addresses as Array<Record<string, unknown>> : [],
      order_count: customerStats.count, total_spent: customerStats.total,
    };
  });
}

export type AdminOperationalData = {
  orders: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  returns: Array<Record<string, unknown>>;
  refunds: Array<Record<string, unknown>>;
};

export async function loadAdminOperationalData(): Promise<AdminOperationalData> {
  if (!supabase) throw new Error("Banco de dados não configurado.");
  const [orders, payments, returns, refunds] = await Promise.all([
    supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("returns").select("*, return_items(*)").order("created_at", { ascending: false }),
    supabase.from("refunds").select("*").order("created_at", { ascending: false }),
  ]);
  for (const result of [orders, payments, returns, refunds]) if (result.error) throw result.error;
  return { orders: orders.data ?? [], payments: payments.data ?? [], returns: returns.data ?? [], refunds: refunds.data ?? [] };
}

export type SupplierSyncRun = {
  id: string;
  provider: string;
  operation: string;
  status: string;
  items_processed: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

export async function listSheinSyncRuns(): Promise<SupplierSyncRun[]> {
  if (!supabase) throw new Error("Banco de dados não configurado.");
  const { data, error } = await supabase.from("supplier_sync_runs").select("id,provider,operation,status,items_processed,error_message,started_at,finished_at").eq("provider", "shein").order("started_at", { ascending: false }).limit(20);
  if (error) throw error;
  return (data ?? []) as SupplierSyncRun[];
}