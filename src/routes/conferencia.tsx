import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConferencePage } from "../../store-ui";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/conferencia")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/login" });
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      sessionStorage.setItem("leh-checkout-return", "/checkout");
      throw redirect({ to: "/login" });
    }
  },
  component: ConferencePage,
});
