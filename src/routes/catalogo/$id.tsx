import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductPage } from "../../../store-ui";
import { products } from "../../data/products";
export const Route = createFileRoute("/catalogo/$id")({ component: DetailRoute });
function DetailRoute() { const { id } = Route.useParams(); const product = products.find((item) => item.id === id); if (!product) throw notFound(); return <ProductPage product={product} />; }
