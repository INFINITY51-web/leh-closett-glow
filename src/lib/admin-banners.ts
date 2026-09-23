import { supabase } from "./supabase";

export type Banner = {
  id: string;
  image_url: string | null;
  title: string | null;
  text: string | null;
  link_url: string | null;
  sort_order: number;
  active: boolean;
};

const fields = "id, image_url, title, text, link_url, sort_order, active";

export async function listAdminBanners(): Promise<Banner[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("banners").select(fields).order("sort_order").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Banner[];
}

export async function saveAdminBanner(input: Omit<Banner, "id"> & { id?: string }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const payload = { image_url: input.image_url || null, title: input.title || null, text: input.text || null, link_url: input.link_url || null, sort_order: input.sort_order, active: input.active };
  const result = input.id ? await supabase.from("banners").update(payload).eq("id", input.id) : await supabase.from("banners").insert(payload);
  if (result.error) throw result.error;
}

export async function deleteAdminBanner(id: string) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

export async function getBannerRotationSeconds(): Promise<number> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("store_settings").select("appearance").eq("id", "default").maybeSingle();
  if (error) throw error;
  const appearance = data?.appearance && typeof data.appearance === "object" ? data.appearance as Record<string, unknown> : {};
  const value = Number(appearance.banner_rotation_seconds);
  return Number.isFinite(value) && value >= 1 ? value : 3;
}

export async function saveBannerRotationSeconds(seconds: number) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const current = await supabase.from("store_settings").select("appearance").eq("id", "default").maybeSingle();
  if (current.error) throw current.error;
  const appearance = current.data?.appearance && typeof current.data.appearance === "object" ? current.data.appearance as Record<string, unknown> : {};
  const { error } = await supabase.from("store_settings").upsert({ id: "default", appearance: { ...appearance, banner_rotation_seconds: Math.max(1, Math.round(seconds)) } });
  if (error) throw error;
}
