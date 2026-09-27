import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "../components/ui/button";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha | LEH_CLOSETT GLOW" }, { name: "description", content: "Crie uma nova senha para sua conta LEH_CLOSETT GLOW." }, { property: "og:title", content: "Redefinir senha | LEH_CLOSETT GLOW" }, { property: "og:description", content: "Recupere o acesso à sua conta com segurança." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate(); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [ready, setReady] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { const hash = new URLSearchParams(window.location.hash.slice(1)); const search = new URLSearchParams(window.location.search); setReady(hash.get("type") === "recovery" || search.get("type") === "recovery"); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); if (!supabase || !ready) return; if (password.length < 6) { setMessage("A senha deve ter pelo menos 6 caracteres."); return; } if (password !== confirm) { setMessage("As senhas não coincidem."); return; } setSaving(true); const { error } = await supabase.auth.updateUser({ password }); setSaving(false); if (error) setMessage(error.message); else { setMessage("Senha atualizada com sucesso."); window.setTimeout(() => void navigate({ to: "/conta", replace: true }), 800); } }
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground"><section className="w-full max-w-md rounded-lg border border-border bg-card p-7"><Link to="/login" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} />Voltar</Link><KeyRound className="text-primary" /><h1 className="mt-4 text-3xl">Redefinir senha</h1>{!ready ? <p className="mt-4 text-sm text-muted-foreground">Abra esta página pelo link de recuperação recebido no seu e-mail.</p> : <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm">Nova senha<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" /></label><label className="block text-sm">Confirmar nova senha<input type="password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>{message && <p role="status" className="text-sm text-primary">{message}</p>}<Button className="w-full" disabled={saving}>{saving ? "Salvando..." : "Salvar nova senha"}</Button></form>}</section></main>;
}