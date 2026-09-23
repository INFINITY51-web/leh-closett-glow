import { supabase } from "./supabase";

export type InventoryRow = {
  id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  minimum_quantity: number;
};

export type InventoryMovement = {
  id: string;
  variant_id: string;
  movement_type: "entry" | "exit" | "adjustment";
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type InventoryReservation = {
  id: string;
  variant_id: string;
  quantity: number;
  status: string;
  created_at: string;
};

export async function listInventory(): Promise<InventoryRow[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("inventory_stock").select("id, product_id, variant_id, sku, product_name, size, color, quantity, minimum_quantity").order("product_name");
  if (error) throw error;
  return (data ?? []) as InventoryRow[];
}

export async function updateInventoryMinimum(variantId: string, minimumQuantity: number) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("inventory_stock").update({ minimum_quantity: minimumQuantity }).eq("variant_id", variantId);
  if (error) throw error;
}

export async function adjustVariantStock(input: { variantId: string; newQuantity: number; movementQuantity: number; movementType: "entry" | "exit" | "adjustment"; note: string }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  if (!Number.isInteger(input.newQuantity) || input.newQuantity < 0) throw new Error("O estoque não pode ser negativo.");
  const { error: updateError } = await supabase.from("product_variants").update({ stock_quantity: input.newQuantity }).eq("id", input.variantId);
  if (updateError) throw updateError;
  try {
    await registerInventoryMovement({ variant_id: input.variantId, movement_type: input.movementType, quantity: input.movementQuantity, note: input.note });
  } catch {
    // A movimentação é opcional nesta etapa; o saldo já foi salvo na variante.
  }
}

export async function listInventoryMovements(variantId?: string): Promise<InventoryMovement[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  let query = supabase
    .from("inventory_movements")
    .select("id, variant_id, movement_type, quantity, reference_type, reference_id, note, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (variantId) query = query.eq("variant_id", variantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InventoryMovement[];
}

export async function listInventoryReservations(): Promise<InventoryReservation[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase
    .from("inventory_reservations")
    .select("id, variant_id, quantity, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as InventoryReservation[];
}

export async function registerInventoryMovement(input: {
  variant_id: string;
  movement_type: "entry" | "exit" | "adjustment";
  quantity: number;
  reference_type?: string | null;
  reference_id?: string | null;
  note: string;
}) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sessão administrativa expirada.");
  const { error } = await supabase.from("inventory_movements").insert({
    ...input,
    reference_type: input.reference_type ?? null,
    reference_id: input.reference_id ?? null,
    created_by: user.id,
  });
  if (error) throw error;
}
