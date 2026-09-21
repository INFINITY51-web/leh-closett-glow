import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./src/data/products";
import { supabase } from "./src/lib/supabase";

export type CartItem = { product: Product; quantity: number; size: string; color: string; variantId?: string };
type CartContextValue = { items: CartItem[]; totalItems: number; subtotal: number; addItem: (product: Product, quantity: number, size: string, color: string) => void; updateQuantity: (id: string, quantity: number) => void; removeItem: (id: string) => void; clearCart: () => void; syncSupabaseCart: () => Promise<string | null> }; 
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => { try { return JSON.parse(sessionStorage.getItem("leh-cart") || "[]"); } catch { return []; } });
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { if (!supabase) return; supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);
  useEffect(() => { sessionStorage.setItem("leh-cart", JSON.stringify(items)); }, [items]);
  const syncSupabaseCart = async () => {
    if (!supabase) return null;
    // A tela de conferência pode ser aberta antes do efeito que carrega userId.
    // Consulte a sessão atual para não interromper a finalização nesse intervalo.
    const currentUserId = userId ?? (await supabase.auth.getUser()).data.user?.id ?? null;
    if (!currentUserId) return null;
    const { data: cart, error: cartError } = await supabase.from("carts").select("id").eq("user_id", currentUserId).maybeSingle();
    if (cartError) throw cartError;
    let cartId = cart?.id;
    if (!cartId) {
      const created = await supabase.from("carts").insert({ user_id: currentUserId }).select("id").single();
      if (created.error) throw created.error;
      cartId = created.data?.id;
    }
    if (!cartId) return null;
    sessionStorage.setItem("leh-supabase-cart-id", cartId);
    for (const item of items) {
      if (!item.variantId) continue;
      const { error } = await supabase.from("cart_items").upsert({ cart_id: cartId, product_id: item.product.id, variant_id: item.variantId, quantity: item.quantity, unit_price: item.product.salePrice ?? item.product.price }, { onConflict: "cart_id,variant_id" });
      if (error) throw error;
    }
    return cartId;
  };
  useEffect(() => { void syncSupabaseCart().catch(() => undefined); }, [userId, items]);
  const value = useMemo(() => ({ items, totalItems: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + (item.product.salePrice ?? item.product.price) * item.quantity, 0), addItem: (product: Product, quantity: number, size: string, color: string) => setItems((current) => { const variantId = product.variantIds?.[`${size}::${color}`]; const existing = current.find((item) => item.product.id === product.id && item.size === size && item.color === color); return existing ? current.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { product, quantity, size, color, ...(variantId !== undefined ? { variantId } : {}) }]; }), updateQuantity: (id: string, quantity: number) => setItems((current) => current.map((item) => getCartItemKey(item) === id ? { ...item, quantity: Math.max(1, quantity) } : item)), removeItem: (id: string) => setItems((current) => current.filter((item) => getCartItemKey(item) !== id)), clearCart: () => setItems([]), syncSupabaseCart }), [items, userId]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function getCartItemKey(item: CartItem) { return `${item.product.id}-${item.size}-${item.color}`; }
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart deve ser usado dentro de CartProvider"); return context; }
