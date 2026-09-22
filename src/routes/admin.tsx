import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminSession, signOutAdmin, type AdminSession } from "../lib/admin-auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const session = await getAdminSession();
    if (!session && location.pathname !== "/admin/login") {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminRouteLayout,
});

function AdminRouteLayout() {
  const location = useLocation();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getAdminSession().then((currentSession) => {
      if (!active) return;
      setSession(currentSession);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (location.pathname === "/admin/login") return <Outlet />;

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Carregando painel...</main>;
  }

  if (!session) return null;

  return <AdminDashboard session={session} />;
}

function AdminDashboard({ session }: { session: AdminSession }) {
  const navigate = useNavigate();
  const [section, setSection] = useState("Visão geral");

  async function handleSignOut() {
    await signOutAdmin();
    await navigate({ to: "/admin/login", replace: true });
  }

  const sections = ["Visão geral", "Site e Conteúdo", "Produtos", "Estoque", "Pedidos", "Logística", "Devoluções", "Financeiro", "Análises", "Clientes", "Configurações"];

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link to="/admin" className="text-sm font-semibold tracking-[0.16em]">LEH_CLOSETT <span className="text-primary">GLOW</span></Link>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{session.email}</span>
          <button type="button" onClick={handleSignOut} className="rounded-lg border border-border px-3 py-2 transition hover:border-primary hover:text-primary">Sair</button>
        </div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[14rem_1fr] md:px-8">
      <nav aria-label="Navegação administrativa" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {sections.map((item) => <button key={item} type="button" onClick={() => setSection(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition ${section === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item}</button>)}
      </nav>
      <main key={section} className="min-w-0">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-primary">Painel administrativo</p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{section}</h1>
        {section === "Visão geral" ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><article className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Acesso administrativo</p><p className="mt-3 text-lg font-medium">Painel ativo</p></article><article className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Conta conectada</p><p className="mt-3 truncate text-lg font-medium">{session.email}</p></article></div> : <section className="mt-8 rounded-xl border border-border bg-card p-8"><p className="text-muted-foreground">Selecione uma função no menu para visualizar e gerenciar esta área.</p></section>}
      </main>
    </div>
  </div>;
}
