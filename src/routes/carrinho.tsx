import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "../../store-ui";
export const Route = createFileRoute("/carrinho")({ component: CartPage });
