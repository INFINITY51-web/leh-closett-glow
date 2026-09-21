import { supabase } from "./supabase";

export type Profile = { id: string; full_name?: string | null; cpf?: string | null; phone?: string | null; role?: string | null; is_active?: boolean | null };

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function isValidPhone(value: string) {
  const phone = value.replace(/\D/g, "");
  if (![10, 11].includes(phone.length) || /^(\d)\1+$/.test(phone)) return false;
  if (/^([0-9])\1+$/.test(phone)) return false;
  return !["0123456789", "1234567890", "9876543210"].includes(phone);
}

export function isValidCpf(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}
export type Address = { id: string; label?: string | null; recipient_name?: string | null; phone?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; postal_code?: string | null; is_default?: boolean | null };

async function userId() {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Faça login para acessar sua conta");
  return data.user.id;
}

export async function getCustomerAddresses() {
  const id = await userId();
  const { data, error } = await supabase!.from("addresses").select("*").eq("user_id", id).order("is_default", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Address[];
}

export async function getCustomerAccount() {
  const id = await userId();
  const [profile, addresses, favorites] = await Promise.all([
    supabase!.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase!.from("addresses").select("*").eq("user_id", id).order("is_default", { ascending: false }),
    supabase!.from("favorites").select("product_id, variant_id").eq("user_id", id),
  ]);
  if (profile.error) throw profile.error;
  if (addresses.error) throw addresses.error;
  if (favorites.error) throw favorites.error;
  return { profile: profile.data as Profile | null, addresses: (addresses.data ?? []) as Address[], favorites: favorites.data ?? [] };
}

export async function updateProfile(values: Partial<Pick<Profile, "full_name" | "cpf" | "phone">>) {
  const id = await userId();
  const payload = { id, ...values };

  // Upsert torna a ordem do salvamento determinística: cria o perfil quando
  // ele ainda não existe e atualiza a mesma linha quando já existe.
  const { data, error } = await supabase!
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, full_name, cpf, phone, role, is_active")
    .single();

  if (error) throw new Error(error.message || "Não foi possível salvar seus dados.");
  return data as Profile;
}

export async function saveAddress(values: Partial<Address> & { id?: string }) {
  const id = await userId();
  const { id: addressId, ...payload } = values;
  // Salva primeiro. Assim uma falha ao marcar o endereço principal não
  // impede o cadastro do endereço.
  const query = addressId
    ? supabase!.from("addresses").update(payload).eq("id", addressId).eq("user_id", id).select("*").single()
    : supabase!.from("addresses").insert({ ...payload, user_id: id }).select("*").single();
  const { data, error } = await query;
  if (error) throw new Error(error.message || "Não foi possível gravar o endereço.");

  if (payload.is_default) {
    const { error: defaultError } = await supabase!.from("addresses").update({ is_default: false }).eq("user_id", id).neq("id", data.id);
    if (defaultError) throw new Error(`Endereço salvo, mas não foi possível defini-lo como principal: ${defaultError.message}`);
    const { error: currentError } = await supabase!.from("addresses").update({ is_default: true }).eq("id", data.id).eq("user_id", id);
    if (currentError) throw new Error(`Endereço salvo, mas não foi possível defini-lo como principal: ${currentError.message}`);
  }
  return data as Address;
}

export async function deleteAddress(addressId: string) {
  const id = await userId();
  const { error } = await supabase!.from("addresses").delete().eq("id", addressId).eq("user_id", id);
  if (error) throw error;
}

export async function setDefaultAddress(addressId: string) {
  const id = await userId();
  await supabase!.from("addresses").update({ is_default: false }).eq("user_id", id);
  const { error } = await supabase!.from("addresses").update({ is_default: true }).eq("id", addressId).eq("user_id", id);
  if (error) throw error;
}

export type CustomerOrder = {
  id: string;
  order_number?: string | null;
  status?: string | null;
  payment_status?: string | null;
  shipping_status?: string | null;
  created_at?: string | null;
  total?: number | null;
  order_items?: Array<Record<string, unknown>>;
  shipment?: Record<string, unknown> | null;
  shipments?: Array<Record<string, unknown>>;
};

export async function listCustomerOrders() {
  const id = await userId();
  const { data, error } = await supabase!.from("orders").select("*, order_items(*), shipments(*)").eq("user_id", id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerOrder[];
}

export async function requestReturn(orderId: string, reason: string) {
  const id = await userId();
  const { data, error } = await supabase!.from("returns").insert({ order_id: orderId, user_id: id, reason, status: "requested" }).select().single();
  if (error) throw error;
  return data;
}

export async function toggleFavorite(productId: string, variantId?: string | null) {
  const id = await userId();
  const existing = await supabase!.from("favorites").select("product_id").eq("user_id", id).eq("product_id", productId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    const { error } = await supabase!.from("favorites").delete().eq("user_id", id).eq("product_id", productId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase!.from("favorites").insert({ user_id: id, product_id: productId, variant_id: variantId ?? null });
  if (error) throw error;
  return true;
}
