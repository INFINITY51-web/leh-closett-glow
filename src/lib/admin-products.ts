import { supabase } from "./supabase";

export type AdminProduct = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  active: boolean;
  featured: boolean;
  published: boolean;
  product_variants: Array<{ id: string; sku: string; size: string | null; color: string | null; price_override: number | null; stock_quantity: number; active: boolean }>;
  product_images: Array<{ id: string; image_url: string; alt_text: string | null; sort_order: number; is_primary: boolean }>;
};

const select = "id, category_id, name, slug, description, price, compare_at_price, active, featured, published, product_variants(id, sku, size, color, price_override, stock_quantity, active), product_images(id, image_url, alt_text, sort_order, is_primary)";

export async function listAdminProducts(): Promise<AdminProduct[]> {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("products").select(select).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminProduct[];
}

export async function saveAdminProduct(input: { id?: string; name: string; slug: string; description: string; price: number; category_id: string | null; active: boolean; featured: boolean; published: boolean; sizes: string[]; colors: string[]; sku: string; stock_quantity: number; images: string[]; primaryImage: number }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const payload = { name: input.name, slug: input.slug, description: input.description || null, price: input.price, category_id: input.category_id || null, active: input.active, featured: input.featured, published: input.published };
  const result = input.id ? await supabase.from("products").update(payload).eq("id", input.id).select("id").single() : await supabase.from("products").insert(payload).select("id").single();
  if (result.error) throw result.error;
  const productId = result.data.id;
  if (input.id) {
    const { error } = await supabase.from("product_variants").delete().eq("product_id", productId);
    if (error) throw error;
    const removed = await supabase.from("product_images").delete().eq("product_id", productId);
    if (removed.error) throw removed.error;
  }
  const variants = input.sizes.flatMap((size) => (input.colors.length ? input.colors : [null]).map((color) => ({ product_id: productId, sku: input.sku || `${input.slug}-${size}-${color ?? "unica"}`.toUpperCase(), size, color, stock_quantity: input.stock_quantity, active: true })));
  if (variants.length) { const { error } = await supabase.from("product_variants").insert(variants); if (error) throw error; }
  const images = input.images.filter(Boolean).map((image_url, index) => ({ product_id: productId, image_url, alt_text: input.name, sort_order: index, is_primary: index === input.primaryImage }));
  if (images.length) { const { error } = await supabase.from("product_images").insert(images); if (error) throw error; }
}

export async function uploadAdminProductImage(productId: string, file: File, altText: string, sortOrder: number, isPrimary: boolean) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
  if (upload.error) throw upload.error;
  const { data: publicFile } = supabase.storage.from("product-images").getPublicUrl(path);
  const { data, error } = await supabase.from("product_images").insert({ product_id: productId, image_url: publicFile.publicUrl, alt_text: altText || null, sort_order: sortOrder, is_primary: isPrimary }).select("id, image_url, alt_text, sort_order, is_primary").single();
  if (error) {
    await supabase.storage.from("product-images").remove([path]);
    throw error;
  }
  return data as AdminProduct["product_images"][number];
}

export async function removeAdminProductImage(imageId: string, imageUrl: string) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
  const marker = "/storage/v1/object/public/product-images/";
  const path = imageUrl.split(marker)[1];
  if (path) await supabase.storage.from("product-images").remove([decodeURIComponent(path)]);
}

export async function saveAdminProductVariant(input: { id?: string; product_id: string; sku: string; size: string | null; color: string | null; price_override: number | null; stock_quantity: number; active: boolean }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const payload = { product_id: input.product_id, sku: input.sku, size: input.size, color: input.color, price_override: input.price_override, stock_quantity: input.stock_quantity, active: input.active };
  const result = input.id ? await supabase.from("product_variants").update(payload).eq("id", input.id).select("id, sku, size, color, price_override, stock_quantity, active").single() : await supabase.from("product_variants").insert(payload).select("id, sku, size, color, price_override, stock_quantity, active").single();
  if (result.error) throw result.error;
  return result.data as AdminProduct["product_variants"][number];
}

export async function removeAdminProductVariant(id: string) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleAdminProduct(id: string, field: "active" | "featured", value: boolean) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("products").update({ [field]: value }).eq("id", id);
  if (error) throw error;
}

export async function deleteAdminProduct(id: string) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function updateAdminProductPromotion(input: { id: string; active?: boolean; clear?: boolean }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const payload = input.clear ? { compare_at_price: null } : input.active === undefined ? {} : { active: input.active };
  const { error } = await supabase.from("products").update(payload).eq("id", input.id);
  if (error) throw error;
}

export async function updateAdminProductPrice(input: { id: string; price: number; compare_at_price: number | null; variantPrices: Array<{ id: string; price_override: number | null }> }) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("products").update({ price: input.price, compare_at_price: input.compare_at_price }).eq("id", input.id);
  if (error) throw error;
  for (const variant of input.variantPrices) {
    const result = await supabase.from("product_variants").update({ price_override: variant.price_override }).eq("id", variant.id);
    if (result.error) throw result.error;
  }
}
