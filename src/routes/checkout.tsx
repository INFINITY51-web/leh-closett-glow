import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "../../store-ui";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });
