export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  available: boolean;
  colors: string[];
  sizes: string[];
  description: string;
  images: string[];
  badge?: string;
  variantIds?: Record<string, string>;
};

export const products: Product[] = [
  { id: "nocturne-dress", name: "Nocturne Glow Dress", category: "Vestidos", price: 489.9, salePrice: 389.9, available: true, colors: ["Onyx", "Neon Pink"], sizes: ["PP", "P", "M", "G"], description: "Silhueta fluida com presença noturna e acabamento luminoso.", images: ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85"], badge: "-20%" },
  { id: "orbit-blazer", name: "Orbit Tailoring Blazer", category: "Alfaiataria", price: 629.9, available: true, colors: ["Black"], sizes: ["P", "M", "G"], description: "Alfaiataria precisa para uma presença marcante.", images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=1000&q=85"], badge: "Novo" },
  { id: "glow-top", name: "Second Skin Glow Top", category: "Tops", price: 229.9, salePrice: 179.9, available: true, colors: ["Neon Pink", "Silver"], sizes: ["PP", "P", "M"], description: "Textura segunda pele com brilho sutil e corte contemporâneo.", images: ["https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&w=1000&q=85"], badge: "Best-seller" },
  { id: "chrome-skirt", name: "Chrome Motion Skirt", category: "Saias", price: 349.9, available: false, colors: ["Chrome"], sizes: ["P", "M", "G"], description: "Movimento e reflexo em uma peça de impacto.", images: ["https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=1000&q=85"] },
];

export const formatPrice = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
