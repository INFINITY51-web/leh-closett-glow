import type { CartItem } from "../../cart-context";
import { supabase } from "./supabase";

export type OrderCustomer = { fullName: string; cpf: string; phone: string; email: string; address: string; cep: string; city: string; state: string };
export type Order = { id?: string; number: string; date: string; customer: OrderCustomer; items: CartItem[]; subtotal: number; shipping: number; total: number; status: "preparando"; shippingQuoteId?: string; notes?: string };

export function createOrderNumber() { return `LC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`; }

export async function saveOrder(order: Order) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("É necessário estar autenticado para criar o pedido.");
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
  if (!cart?.id) throw new Error("Carrinho Supabase não encontrado.");
  const { data, error } = await supabase.rpc("create_order_from_cart", { p_cart_id: cart.id, p_shipping_address: order.customer.address, p_shipping_cep: order.customer.cep, p_shipping_city: order.customer.city, p_shipping_state: order.customer.state, p_shipping_total: order.shipping, p_shipping_quote_id: order.shippingQuoteId ?? null, p_notes: order.notes ?? null });
  if (error) throw error;
  const created = (Array.isArray(data) ? data[0] : data) as { id: string; created_at?: string; order_number?: string };
  if (!created?.id) throw new Error("O Supabase não retornou o pedido criado.");
  return { ...order, id: created.id, number: created.order_number ?? order.number, date: created.created_at ?? new Date().toISOString() };
}

export async function createMercadoPagoCheckout(order: { id: string; number: string; total: number }) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.functions.invoke("mercadopago-create-checkout", {
    body: {
      order_id: order.id,
      external_reference: order.id,
      order_number: order.number,
      amount: order.total,
    },
  });
  if (error) throw error;
  const checkoutUrl = data?.init_point ?? data?.sandbox_init_point ?? data?.checkout_url ?? data?.url;
  if (!checkoutUrl) throw new Error("O Mercado Pago não retornou a URL do checkout.");
  return checkoutUrl as string;
}

export async function syncMercadoPagoOrder(externalReference: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.functions.invoke("mercadopago-sync-order", {
    body: { external_reference: externalReference, order_id: externalReference },
  });
  if (error) throw error;
  return data;
}

export async function getOrder(number: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("order_number", number).single();
  if (error) throw error;
  return data;
}

export async function listAdminOrders() {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAdminOrder(id: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateAdminOrderStatus(orderId: string, status: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.rpc("admin_update_order_status", { p_order_id: orderId, p_status: status });
  if (error) throw error;
  return data;
}

export async function listAdminShipments() {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertAdminShipment(values: { order_id: string; carrier: string; service: string; tracking_code: string; status: string }) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.rpc("admin_upsert_shipment", { p_order_id: values.order_id, p_carrier: values.carrier, p_service: values.service, p_tracking_code: values.tracking_code, p_status: values.status });
  if (error) throw error;
  return data;
}

export async function listAdminReturns() {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.from("returns").select("*, orders(order_number), return_items(*)").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAdminRefunds() {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.from("refunds").select("*, orders(order_number)").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function processAdminReturn(returnId: string, status: string, note?: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.rpc("admin_process_return", { p_return_id: returnId, p_status: status, p_note: note ?? null });
  if (error) throw error;
  return data;
}

export async function createAdminRefund(values: { order_id: string; return_id?: string | null; amount: number; reason: string }) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.rpc("admin_create_refund", { p_order_id: values.order_id, p_return_id: values.return_id ?? null, p_amount: values.amount, p_reason: values.reason });
  if (error) throw error;
  return data;
}
