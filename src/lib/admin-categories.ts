import { supabase } from "./supabase";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

export async function listAdminCategories(): Promise<AdminCategory[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("categories").select("id, name, slug, description, image_url, active, sort_order").order("sort_order").order("name");
  if (error) throw error;
  return (data ?? []) as AdminCategory[];
}

export async function saveAdminCategory(input: Omit<AdminCategory, "id"> & { id?: string }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const payload = { name: input.name, slug: input.slug, description: input.description || null, image_url: input.image_url || null, active: input.active, sort_order: input.sort_order };
  const result = input.id ? await supabase.from("categories").update(payload).eq("id", input.id) : await supabase.from("categories").insert(payload);
  if (result.error) throw result.error;
}

export async function removeAdminCategory(id: string) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
