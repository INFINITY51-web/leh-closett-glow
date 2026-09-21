import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductPage } from "../../../store-ui";
import { useEffect, useState } from "react";
import { products } from "../../data/products";
import { fetchMappedPublishedProduct } from "../../../catalog-service";
export const Route = createFileRoute("/catalogo/$id")({ component: DetailRoute });
function DetailRoute() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState(products.find((item) => item.id === id));
  useEffect(() => { fetchMappedPublishedProduct(id).then((item) => { if (item) setProduct(item); }).catch(() => undefined); }, [id]);
  if (!product) throw notFound();
  return <ProductPage product={product} />;
}
