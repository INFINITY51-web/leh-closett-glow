import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConferencePage } from "../../store-ui";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/conferencia")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/login" });
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("leh-checkout-return", "/conferencia");
        } catch {
          /* sessão indisponível */
        }
      }
      throw redirect({ to: "/login" });
    }
  },
  component: ConferencePage,
});
