import { Link, useLocation } from "@tanstack/react-router";
import { Heart, LayoutGrid, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../cart-context";

const navItems = [
  { label: "Novidades", to: "/catalogo" as const },
  { label: "Roupas", to: "/catalogo" as const },
  { label: "Acessórios", to: "/catalogo" as const },
  { label: "Glow Club", to: "/conta" as const },
  { label: "Favoritos", to: "/favoritos" as const },
];

function Brand() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="LEH_CLOSETT GLOW início">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary text-xs font-bold tracking-tight text-primary">LC</span>
      <span className="whitespace-nowrap text-[10px] font-semibold tracking-[0.1em] min-[380px]:text-xs sm:text-sm sm:tracking-[0.16em]">LEH_CLOSETT <span className="text-primary">GLOW</span></span>
    </Link>
  );
}

function CartLink({ mobile = false }: { mobile?: boolean }) {
  const { totalItems } = useCart();
  return (
    <Link to="/carrinho" aria-label={`Carrinho com ${totalItems} itens`} className={`relative flex flex-col items-center gap-1 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary ${mobile ? "min-w-16 text-[10px]" : ""}`}>
      <ShoppingBag size={mobile ? 17 : 18} />
      {mobile ? <span>Carrinho</span> : null}
      {totalItems > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{totalItems}</span>}
    </Link>
  );
}

export function SiteNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const visibleMenuItems = navItems.filter((item) => !(pathname === "/catalogo" && item.to === "/catalogo") && !(pathname === "/conta" && item.to === "/conta") && !(pathname === "/favoritos" && item.to === "/favoritos"));
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-1 px-3 min-[380px]:px-4 md:h-18 md:px-8">
          <button type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen((open) => !open)} className="shrink-0 rounded-full p-2 text-primary transition hover:bg-muted md:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Brand />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
            {navItems.map((item) => <Link key={item.label} to={item.to} className="text-sm text-muted-foreground transition hover:text-primary">{item.label}</Link>)}
          </nav>
          <div className="flex shrink-0 items-center gap-1 min-[380px]:gap-2">
            <Link to="/catalogo" aria-label="Buscar produtos" className="inline-flex shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary"><Search size={18} /></Link>
            <Link to="/favoritos" aria-label="Favoritos" className="hidden shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary sm:inline-flex"><Heart size={18} /></Link>
            <Link to="/conta" aria-label="Minha conta" className="hidden shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary sm:inline-flex"><UserRound size={18} /></Link>
            <CartLink />
          </div>
        </div>
        {menuOpen && <nav className="border-t border-border bg-background px-6 py-3 md:hidden" aria-label="Menu mobile">{visibleMenuItems.map((item) => <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="block min-h-12 py-3 text-sm text-muted-foreground hover:text-primary">{item.label}</Link>)}</nav>}
      </header>
      <nav aria-label="Navegação mobile" className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <Link to="/" className="flex min-w-16 flex-col items-center gap-1 p-2 text-[10px] text-muted-foreground hover:text-primary"><span>Início</span></Link>
        <Link to="/catalogo" className="flex min-w-16 flex-col items-center gap-1 p-2 text-[10px] text-muted-foreground hover:text-primary"><LayoutGrid size={17} /><span>Categorias</span></Link>
        <Link to="/favoritos" className="flex min-w-16 flex-col items-center gap-1 p-2 text-[10px] text-muted-foreground hover:text-primary"><Heart size={17} /><span>Favoritos</span></Link>
        <CartLink mobile />
        <Link to="/conta" className="flex min-w-16 flex-col items-center gap-1 p-2 text-[10px] text-muted-foreground hover:text-primary"><UserRound size={17} /><span>Conta</span></Link>
      </nav>
    </>
  );
}
