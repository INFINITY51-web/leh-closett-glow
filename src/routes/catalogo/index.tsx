import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "../../../store-ui";
export const Route = createFileRoute("/catalogo/")({ component: CatalogPage });
