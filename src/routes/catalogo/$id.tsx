import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductPage } from "../../../store-ui";
import { useEffect, useState } from "react";
import { fetchMappedPublishedProducts } from "../../../catalog-service";
export const Route = createFileRoute("/catalogo/$id")({ component: DetailRoute });
function DetailRoute() { const { id } = Route.useParams(); const [product, setProduct] = useState<import("../../data/products").Product | null>(null); const [loading, setLoading] = useState(true); useEffect(() => { void fetchMappedPublishedProducts().then((items) => setProduct(items.find((item) => item.id === id) ?? null)).finally(() => setLoading(false)); }, [id]); if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando produto...</main>; if (!product) throw notFound(); return <ProductPage product={product} />; }
