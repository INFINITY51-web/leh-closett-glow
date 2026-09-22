import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { signInAdmin } from "../lib/admin-auth";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      await navigate({ to: "/admin", replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"><ArrowLeft size={16} /> Voltar para a loja</Link>
      <section className="rounded-xl border border-border bg-card p-7 md:p-9">
        <div className="mb-8 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary text-lg font-bold text-primary">LC</span><div><p className="text-sm font-semibold tracking-[0.18em]">LEH_CLOSETT <span className="text-primary">GLOW</span></p><p className="mt-1 text-xs text-muted-foreground">Área administrativa</p></div></div>
        <div className="mb-7"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary"><LockKeyhole size={19} /></div><h1 className="text-3xl font-semibold tracking-tight">Acesso restrito</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Entre com suas credenciais administrativas para continuar.</p></div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label htmlFor="admin-email" className="mb-2 block text-sm font-medium">E-mail</label><input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></div>
          <div><label htmlFor="admin-password" className="mb-2 block text-sm font-medium">Senha</label><input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" /></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{loading && <LoaderCircle className="animate-spin" size={17} />} {loading ? "Verificando..." : "Acessar painel"}</button>
        </form>
        <div className="mt-7 flex gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><ShieldCheck size={15} className="shrink-0 text-primary" />Acesso preparado para validação segura no backend.</div>
      </section>
    </div>
  </main>;
}
