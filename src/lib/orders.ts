import type { CartItem } from "../../cart-context";
import { supabase } from "./supabase";

export type OrderCustomer = { fullName: string; cpf: string; phone: string; email: string; address: string; cep: string; city: string; state: string };
export type Order = { id?: string; number: string; date: string; customer: OrderCustomer; items: CartItem[]; subtotal: number; shipping: number; total: number; status: "preparando"; shippingQuoteId?: string; notes?: string };

export function createOrderNumber() { return `LC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`; }

export async function saveOrder(order: Order) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("É necessário estar autenticado para criar o pedido.");
  const savedCartId = typeof window !== "undefined" ? sessionStorage.getItem("leh-supabase-cart-id") : null;
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
  const cartId = cart?.id ?? savedCartId;
  if (savedCartId && cart?.id && savedCartId !== cart.id) throw new Error("O carrinho não pertence à sessão atual.");
  if (!cartId) throw new Error("Carrinho Supabase não encontrado.");
  const { count, error: itemsError } = await supabase.from("cart_items").select("id", { count: "exact", head: true }).eq("cart_id", cartId);
  if (itemsError) throw itemsError;
  if (!count) throw new Error("Seu carrinho está vazio.");
  const shippingAddress = {
    full_name: order.customer.fullName,
    email: order.customer.email,
    cpf: order.customer.cpf,
    phone: order.customer.phone,
    address: order.customer.address,
    cep: order.customer.cep,
    city: order.customer.city,
    state: order.customer.state,
  };
  const { data, error } = await supabase.rpc("create_order_from_cart", {
    p_cart_id: cartId,
    p_shipping_address: shippingAddress,
    p_shipping_total: order.shipping,
    p_notes: order.notes ?? null,
  });
  if (error) throw error;
  const orderId = typeof data === "string" ? data : null;
  if (!orderId) throw new Error("O Supabase não retornou o UUID do pedido.");
  return { ...order, id: orderId };
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
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para consultar este pedido.");
  const { data, error } = await supabase.from("orders").select("*, order_items(*), shipments(*)").eq("order_number", number).eq("user_id", auth.user.id).single();
  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para consultar este pedido.");
  const { data, error } = await supabase.from("orders").select("*, order_items(*), shipments(*)").eq("id", id).eq("user_id", auth.user.id).single();
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
