import { supabase } from "./src/lib/supabase";

export type InventoryRow = {
  id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
};

export type InventoryMovement = { id: string; sku: string; movement_type: "entry" | "exit" | "adjustment"; quantity: number; reason: string; responsible: string; created_at: string };

export async function listInventory(): Promise<InventoryRow[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("product_variants").select("id, product_id, sku, size, color, stock_quantity, products(name)").order("sku");
  if (error) throw error;
  const variants = (data ?? []) as Array<{ id: string; product_id: string; sku: string; size: string | null; color: string | null; stock_quantity: number; products: { name: string } | null }>;
  const { data: reservations, error: reservationError } = await supabase.from("inventory_reservations").select("variant_id, quantity").in("variant_id", variants.map((v) => v.id));
  if (reservationError) throw reservationError;
  const reserved = new Map<string, number>();
  for (const row of reservations ?? []) reserved.set(row.variant_id, (reserved.get(row.variant_id) ?? 0) + Number(row.quantity));
  return variants.map((v) => { const held = reserved.get(v.id) ?? 0; return { id: v.id, product_id: v.product_id, variant_id: v.id, sku: v.sku, product_name: v.products?.name ?? "Produto", size: v.size, color: v.color, quantity: v.stock_quantity ?? 0, reserved_quantity: held, available_quantity: Math.max(0, (v.stock_quantity ?? 0) - held) }; });
}

export async function listInventoryMovements(variantId?: string): Promise<InventoryMovement[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const query = supabase.from("inventory_movements").select("id, sku, movement_type, quantity, reason, responsible, created_at").order("created_at", { ascending: false }).limit(100);
  const { data, error } = variantId ? await query.eq("variant_id", variantId) : await query;
  if (error) throw error;
  return (data ?? []) as InventoryMovement[];
}

export async function registerInventoryMovement(input: { variant_id: string; sku: string; movement_type: "entry" | "exit" | "adjustment"; quantity: number; reason: string; responsible: string }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("inventory_movements").insert(input);
  if (error) throw error;
}
