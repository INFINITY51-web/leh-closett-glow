import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteNavigation } from "../components/site-navigation";
import { getCustomerAccount, toggleFavorite } from "../lib/customer-account";
import { products, formatPrice, type Product } from "../data/products";

export const Route = createFileRoute("/favoritos")({ component: FavoritesPage });

function FavoritesPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [message, setMessage] = useState("Carregando seus favoritos...");
  useEffect(() => { getCustomerAccount().then((account) => { const favoriteIds = new Set(account.favorites.map((item) => item.product_id)); const found = products.filter((product) => favoriteIds.has(product.id)); setItems(found); setMessage(found.length ? "" : "Você ainda não adicionou produtos aos favoritos."); }).catch((error) => setMessage(error instanceof Error ? error.message : "Faça login para ver seus favoritos.")); }, []);
  async function remove(product: Product) { await toggleFavorite(product.id); setItems((current) => current.filter((item) => item.id !== product.id)); }
  return <div className="min-h-screen bg-background pb-20 text-foreground"><SiteNavigation /><main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8 md:pt-40"><p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Sua curadoria</p><h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Favoritos<span className="text-primary">.</span></h1><p className="mt-4 max-w-xl text-muted-foreground">Guarde as peças que combinam com sua próxima presença.</p>{message && <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">{message}<br /><Link to="/catalogo" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Explorar catálogo</Link></div>}{items.length > 0 && <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card"><Link to="/catalogo/$id" params={{ id: product.id }}><img src={product.images[0]} alt={product.name} className="aspect-[3/4] w-full object-cover" /><div className="p-4"><p className="text-xs uppercase tracking-widest text-primary">{product.category}</p><h2 className="mt-2 font-medium">{product.name}</h2><p className="mt-2 font-semibold text-primary">{formatPrice(product.salePrice ?? product.price)}</p></div></Link><button onClick={() => remove(product)} className="m-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"><Heart size={16} fill="currentColor" /> Remover</button></article>)}</div>}</main><footer className="border-t border-border px-6 py-12 text-center text-sm text-muted-foreground">LEH_CLOSETT GLOW · Moda para iluminar quem você é.</footer></div>;
}
