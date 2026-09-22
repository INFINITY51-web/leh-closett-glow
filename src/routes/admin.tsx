import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminSession, type AdminSession } from "../lib/admin-auth";

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

  return <Outlet />;
}
