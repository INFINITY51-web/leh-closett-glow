import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { CheckoutPage } from "../../store-ui";

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/login" });
    // A sessão pode estar sendo restaurada pelo Supabase ao abrir a rota.
    // Aguarde brevemente antes de considerar o cliente desconectado.
    let user = (await supabase.auth.getSession()).data.session?.user ?? null;
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      user = (await supabase.auth.getSession()).data.session?.user ?? (await supabase.auth.getUser()).data.user ?? null;
    }
    if (!user) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("leh-checkout-return", "/checkout");
        } catch {
          /* sessão indisponível */
        }
      }
      throw redirect({ to: "/login" });
    }
  },
  component: CheckoutPage,
});
