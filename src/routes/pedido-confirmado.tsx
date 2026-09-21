import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOrder, syncMercadoPagoOrder } from "../lib/orders";

export const Route = createFileRoute("/pedido-confirmado")({ component: OrderConfirmationPage });

type Result = "approved" | "pending" | "rejected" | "loading" | "error";

function OrderConfirmationPage() {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const reference = String(search["external_reference"] ?? search["order_id"] ?? search["externalReference"] ?? "");
  const [result, setResult] = useState<Result>("loading");
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Consultando o status real do pagamento...");

  useEffect(() => {
    let active = true;
    async function verify() {
      if (!reference) { setResult("error"); setMessage("Não encontramos a referência deste pedido."); return; }
      try {
        const synced = await syncMercadoPagoOrder(reference);
        const orderNumber = String((synced as Record<string, unknown>)?.["order_number"] ?? reference);
        const current = await getOrder(orderNumber);
        if (!active) return;
        setOrder(current as Record<string, unknown>);
        const payment = String((current as Record<string, unknown>)["payment_status"] ?? (synced as Record<string, unknown>)?.["payment_status"] ?? "pending").toLowerCase();
        setResult(payment.includes("approved") || payment.includes("paid") ? "approved" : payment.includes("rejected") || payment.includes("cancel") ? "rejected" : "pending");
      } catch { if (active) { setResult("error"); setMessage("Não foi possível consultar o pagamento agora. Tente novamente pela sua conta."); } }
    }
    void verify();
    return () => { active = false; };
  }, [reference]);

  const copy = result === "approved" ? ["Pagamento aprovado", "Seu pedido foi confirmado e seguirá para preparação."] : result === "rejected" ? ["Pagamento não aprovado", "O pedido foi preservado. Você pode tentar novamente quando disponível."] : result === "pending" ? ["Pagamento pendente", "Estamos aguardando a confirmação do Mercado Pago."] : ["Verificando pagamento", message];
  return <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-20"><section className="w-full rounded-2xl border border-border bg-card p-8 text-center"><p className="text-xs uppercase tracking-[0.3em] text-primary">LEH_CLOSETT GLOW</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">{copy[0]}<span className="text-primary">.</span></h1><p className="mx-auto mt-4 max-w-prose leading-relaxed text-muted-foreground">{copy[1]}</p>{order && <p className="mt-6 text-sm">Pedido {String(order["order_number"] ?? reference)} · Status: {String(order["status"] ?? "em atualização")}</p>}<div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/conta" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Ver detalhes do pedido</Link><Link to="/" className="rounded-full border border-border px-6 py-3 text-sm hover:border-primary hover:text-primary">Voltar à loja</Link></div></section></main>;
}
