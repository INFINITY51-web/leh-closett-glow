import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type SessionState = { loading: boolean; user: User | null };

/** Estado de sessão compartilhado por todas as telas da loja. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ loading: true, user: null });

  useEffect(() => {
    if (!supabase) { setState({ loading: false, user: null }); return; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ loading: false, user: data.session?.user ?? null });
    }).catch(() => { if (active) setState({ loading: false, user: null }); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ loading: false, user: session?.user ?? null });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  return state;
}

/** Guarda o destino que deve ser aberto depois do login. */
export function rememberReturnPath(path: string) {
  try { sessionStorage.setItem("leh-checkout-return", path); } catch { /* sessão indisponível */ }
}
