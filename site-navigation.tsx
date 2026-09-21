import { Link } from "@tanstack/react-router";
import { Heart, Home, LayoutGrid, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
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
    <Link to="/" className="flex min-w-0 flex-col items-center leading-none" aria-label="LEH_CLOSETT GLOW início">
      <span className="whitespace-nowrap text-[8px] font-light uppercase tracking-[0.36em] text-foreground/65 min-[380px]:text-[9px]">LEH_CLOSETT</span>
      <span className="mt-1 font-logo text-[15px] font-bold uppercase text-primary drop-shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_60%,transparent)] min-[380px]:text-lg">GLOW</span>
    </Link>
  );
}

function CartLink({ mobile = false }: { mobile?: boolean }) {
  const { totalItems } = useCart();
  return (
    <Link to="/carrinho" aria-label={`Carrinho com ${totalItems} itens`} className={`relative flex flex-col items-center gap-1 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary ${mobile ? "mobile-bottom-nav__item" : ""}`}>
      <ShoppingBag size={mobile ? 18 : 18} />
      {mobile ? <span>Carrinho</span> : null}
      {totalItems > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{totalItems}</span>}
    </Link>
  );
}

export function SiteNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-foreground/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-1 px-4 md:h-20 md:px-8">
          <button type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen((open) => !open)} className="shrink-0 rounded-full p-2 text-primary transition hover:bg-muted md:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Brand />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
            {navItems.map((item) => <Link key={item.label} to={item.to} className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition hover:text-primary">{item.label}</Link>)}
          </nav>
          <div className="flex shrink-0 items-center gap-1 min-[380px]:gap-2">
            <Link to="/catalogo" aria-label="Buscar produtos" className="inline-flex shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary"><Search size={18} /></Link>
            <Link to="/favoritos" aria-label="Favoritos" className="hidden shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary sm:inline-flex"><Heart size={18} /></Link>
            <Link to="/conta" aria-label="Minha conta" className="hidden shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary sm:inline-flex"><UserRound size={18} /></Link>
            <CartLink />
          </div>
        </div>
        {menuOpen && <nav className="border-t border-border bg-background px-6 py-3 md:hidden" aria-label="Menu mobile">{navItems.map((item) => <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="block min-h-12 py-3 text-sm text-muted-foreground hover:text-primary">{item.label}</Link>)}</nav>}
      </header>
      <nav aria-label="Navegação mobile" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 flex h-18 items-stretch justify-around border-t border-primary/60 bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <Link to="/" className="mobile-bottom-nav__item"><Home size={18} /><span>Início</span></Link>
        <Link to="/catalogo" className="mobile-bottom-nav__item"><LayoutGrid size={18} /><span>Categorias</span></Link>
        <Link to="/favoritos" className="mobile-bottom-nav__item"><Heart size={18} /><span>Favoritos</span></Link>
        <CartLink mobile />
        <Link to="/conta" className="mobile-bottom-nav__item"><UserRound size={18} /><span>Conta</span></Link>
      </nav>
    </>
  );
}
