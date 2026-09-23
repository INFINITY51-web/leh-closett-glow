import { supabase } from "./supabase";

export const formatPrice = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export type CatalogProduct = {
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
  product_variants: Array<{
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    price_override: number | null;
    stock_quantity: number;
    active: boolean;
  }>;
  product_images: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
  }>;
};

/** Busca exclusivamente produtos publicados no Supabase. */
export async function fetchPublishedProducts(): Promise<CatalogProduct[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, category_id, name, slug, description, price, compare_at_price, active, featured, published, product_variants(id, sku, size, color, price_override, stock_quantity, active), product_images(id, image_url, alt_text, sort_order, is_primary)")
    .eq("active", true)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar o catálogo: ${error.message}`);
  return (data ?? []) as CatalogProduct[];
}
