import { supabase } from "./src/lib/supabase";
import type { Product } from "./src/data/products";

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

/** Busca o catálogo público. Em caso de configuração ausente, preserva o fallback local da UI. */
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

export async function fetchMappedPublishedProducts(): Promise<Product[]> {
  const [items, categories] = await Promise.all([fetchPublishedProducts(), fetchActiveCategories()]);
  return items.map((item) => {
    const variants = item.product_variants.filter((variant) => variant.active);
    const images = item.product_images
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => image.image_url)
      .filter(Boolean);
    const salePrice = variants.find((variant) => variant.price_override != null)?.price_override
      ?? (item.compare_at_price != null ? item.price : undefined);
    return {
      id: item.id,
      name: item.name,
      category: categories.find((category) => category.id === item.category_id)?.name ?? "Coleção",
      price: item.price,
      ...(salePrice != null ? { salePrice } : {}),
      available: variants.length === 0 || variants.some((variant) => variant.stock_quantity > 0),
      colors: [...new Set(variants.map((variant) => variant.color).filter(Boolean))] as string[],
      sizes: [...new Set(variants.map((variant) => variant.size).filter(Boolean))] as string[],
      description: item.description ?? "",
      images: images.length ? images : [""],
      ...(item.featured ? { badge: "Destaque" } : {}),
    };
  });
}

export async function fetchActiveCategories(): Promise<Array<{ id: string; name: string }>> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("categories").select("id, name").eq("active", true).order("name");
  if (error) throw new Error(`Não foi possível carregar as categorias: ${error.message}`);
  return (data ?? []) as Array<{ id: string; name: string }>;
}
