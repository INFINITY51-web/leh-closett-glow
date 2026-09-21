import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConferencePage } from "../../store-ui";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/conferencia")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/login" });
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
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
