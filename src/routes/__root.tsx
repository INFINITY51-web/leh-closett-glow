import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import appCss from "../styles.css?url";
import { CartProvider } from "../../cart-context";
import "../lib/supabase";

function NotFoundComponent() { return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2><p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p><Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link></div></div>; }

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "LEH_CLOSETT GLOW" }], links: [{ rel: "stylesheet", href: appCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&family=Syncopate:wght@700&display=swap" }] }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) { return <html lang="pt-BR"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }
function ThemePersistence() { useEffect(() => { try { const raw = localStorage.getItem("leh-closett-appearance"); if (!raw) return; const settings = JSON.parse(raw) as Record<string, string>; const root = document.documentElement; if (settings.primary) root.style.setProperty("--primary", settings.primary); if (settings.accent) root.style.setProperty("--accent", settings.accent); if (settings.background) root.style.setProperty("--background", settings.background); if (settings.text) root.style.setProperty("--foreground", settings.text); if (settings.font) root.style.setProperty("--site-font-family", settings.font); } catch { /* Mantém os tokens padrão quando não houver configuração válida. */ } }, []); return null; }
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return <QueryClientProvider client={queryClient}><CartProvider><ThemePersistence /><Outlet /></CartProvider></QueryClientProvider>;
}
