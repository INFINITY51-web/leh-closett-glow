import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/login")({ component: LoginPage });

type Mode = "login" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function changeMode(next: Mode) {
    setMode(next); setError(""); setSuccess("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!supabase) { setError("O serviço de autenticação está indisponível."); return; }
    if (mode === "signup" && !name.trim()) { setError("Informe seu nome completo."); return; }
    if (!identifier.trim()) { setError("Informe seu e-mail."); return; }
    if (mode === "signup" && password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (mode === "signup" && password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const credentials = identifier.includes("@") ? { email: identifier.trim() } : { phone: identifier.trim() };
        const { error: authError } = await supabase.auth.signInWithPassword({ ...credentials, password });
        if (authError) throw authError;
        setLoading(false);
        await navigate({ to: "/conta", replace: true });
        return;
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email: identifier.trim(), password, options: { data: { full_name: name.trim() } } });
        if (authError) throw authError;
        if (data.session) {
          setLoading(false);
          await navigate({ to: "/conta", replace: true });
          return;
        }
        setSuccess("Conta criada. Confira seu e-mail para confirmar o acesso.");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Não foi possível concluir a autenticação.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError(""); setSuccess("");
    if (!supabase || !identifier.includes("@")) { setError("Informe seu e-mail para recuperar a senha."); return; }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), { redirectTo: `${window.location.origin}/conta` });
    setLoading(false);
    if (resetError) setError(resetError.message); else setSuccess("Enviamos as instruções para seu e-mail.");
  }

  return <main className="min-h-screen bg-background px-5 py-8 text-foreground md:px-8 md:py-12">
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col justify-between gap-12">
      <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"><ArrowLeft size={16} /> Voltar à loja</Link>
      <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-neon-soft sm:p-10">
        <div className="mb-8 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">LEH_CLOSETT GLOW</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">{mode === "login" ? "Bem-vinda de volta." : "Crie sua conta."}</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{mode === "login" ? "Entre para acompanhar seus pedidos e sua experiência Glow." : "Faça parte da experiência Glow."}</p></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && <label className="block text-sm font-medium">Nome completo<input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label>}
          <label className="block text-sm font-medium">{mode === "login" ? "E-mail ou telefone" : "E-mail"}<input required type={mode === "login" ? "text" : "email"} autoComplete="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label>
          <label className="block text-sm font-medium">Senha<div className="relative mt-2"><input required type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 pr-12 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /> <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-primary">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {mode === "signup" && <label className="block text-sm font-medium">Confirmar senha<input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></label>}
          {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{success && <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{success}</p>}
          <button disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{loading && <Loader2 size={17} className="animate-spin" />}{mode === "login" ? "Entrar" : "Criar conta"}</button>
        </form>
        {mode === "login" && <button type="button" onClick={resetPassword} disabled={loading} className="mt-5 block w-full text-center text-sm text-muted-foreground hover:text-primary disabled:opacity-60">Esqueci minha senha</button>}
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">{mode === "login" ? "Ainda não tem uma conta?" : "Já tem uma conta?"} <button type="button" onClick={() => changeMode(mode === "login" ? "signup" : "login")} className="font-semibold text-primary hover:text-foreground">{mode === "login" ? "Criar minha conta" : "Entrar"}</button></div>
      </section>
      <div />
    </div>
  </main>;
}
