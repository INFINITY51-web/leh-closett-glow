import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { CheckoutPage } from "../../store-ui";

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/login" });
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
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
