import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { CheckoutPage } from "../../store-ui";

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/login" });
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
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
