import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { StoreShell } from "./store-ui";
import { formatPrice } from "./src/data/products";
import { getOrder } from "./src/lib/orders";

type OrderItemRow = { id: string; product_name: string; product_image: string | null; quantity: number; variation: string | null; subtotal: number };
type OrderRow = { order_number: string; created_at: string; subtotal: number; shipping: number; total: number; status: string; order_items: OrderItemRow[] };

export function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const number = new URLSearchParams(window.location.search).get("numero");
    if (!number) { setLoading(false); return; }
    getOrder(number)
      .then((data) => setOrder(data as unknown as OrderRow))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, []);

  return <StoreShell><main className="mx-auto max-w-3xl px-5 pb-24 pt-36 md:px-8">
    {loading ? <p className="text-center text-muted-foreground">Carregando pedido...</p> : !order ? <div className="rounded-3xl border border-border bg-card p-10 text-center"><h1 className="text-3xl font-semibold">Nenhum pedido encontrado.</h1><Link to="/catalogo" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Voltar ao catálogo</Link></div> : <div className="rounded-3xl border border-primary/40 bg-card p-6 md:p-10">
      <div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check size={30} /></div><p className="mt-6 text-xs uppercase tracking-[0.3em] text-primary">Pedido recebido</p><h1 className="mt-3 text-4xl font-semibold md:text-5xl">Tudo certo<span className="text-primary">.</span></h1><p className="mt-3 text-muted-foreground">Número do pedido: <strong className="text-foreground">{order.order_number}</strong></p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</p></div>
      <div className="mt-10 space-y-4 border-t border-border pt-6">{order.order_items.map((item) => <div key={item.id} className="flex gap-4">{item.product_image && <img src={item.product_image} alt={item.product_name} className="h-20 w-16 rounded-lg object-cover" />}<div className="flex-1"><p className="font-medium">{item.product_name}</p><p className="text-sm text-muted-foreground">{item.quantity}x{item.variation ? ` · ${item.variation}` : ""}</p></div><span className="font-medium">{formatPrice(item.subtotal)}</span></div>)}</div>
      <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{order.shipping ? formatPrice(order.shipping) : "Grátis"}</span></div><div className="flex justify-between text-xl font-semibold"><span>Total</span><span className="text-primary">{formatPrice(order.total)}</span></div><p className="pt-3 text-center text-xs uppercase tracking-widest text-primary">Status: {order.status}</p></div>
      <Link to="/catalogo" className="mt-8 block rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:shadow-[0_0_25px_color-mix(in_oklab,var(--primary)_45%,transparent)]">Continuar explorando</Link>
    </div>}
  </main></StoreShell>;
}
