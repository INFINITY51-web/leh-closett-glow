import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "./store-ui";
import { SiteNavigation } from "./src/components/site-navigation";
import { getCustomerAccount, toggleFavorite } from "./src/lib/customer-account";
import { products, type Product } from "./src/data/products";

export const Route = createFileRoute("/favoritos")({ component: FavoritesPage });

function FavoritesPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [message, setMessage] = useState("Carregando seus favoritos...");
  useEffect(() => { getCustomerAccount().then((account) => { const favoriteIds = new Set(account.favorites.map((item) => item.product_id)); const found = products.filter((product) => favoriteIds.has(product.id)); setItems(found); setMessage(found.length ? "" : "Você ainda não adicionou produtos aos favoritos."); }).catch((error) => setMessage(error instanceof Error ? error.message : "Faça login para ver seus favoritos.")); }, []);
  async function remove(product: Product) { await toggleFavorite(product.id); setItems((current) => current.filter((item) => item.id !== product.id)); }
  return <div className="min-h-screen bg-background pb-20 text-foreground"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8 md:pt-40"><h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Favoritos<span className="text-primary">.</span></h1>{message && <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">{message}<br /><Link to="/catalogo" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Explorar catálogo</Link></div>}{items.length > 0 && <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">{items.map((product) => <div key={product.id} className="relative"><ProductCard product={product} /><button onClick={() => remove(product)} className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"><Heart size={16} fill="currentColor" /> Remover</button></div>)}</div>}</main><footer className="border-t border-border px-6 py-12 text-center text-sm text-muted-foreground">LEH_CLOSETT GLOW · Moda para iluminar quem você é.</footer></div>;
}
