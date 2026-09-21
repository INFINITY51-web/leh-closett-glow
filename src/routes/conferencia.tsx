import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConferencePage } from "../../store-ui";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/conferencia")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/login" });
    // Evita interpretar a sessão como ausente enquanto o Supabase a restaura.
    let user = (await supabase.auth.getSession()).data.session?.user ?? null;
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      user = (await supabase.auth.getSession()).data.session?.user ?? (await supabase.auth.getUser()).data.user ?? null;
    }
    if (!user) {
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
