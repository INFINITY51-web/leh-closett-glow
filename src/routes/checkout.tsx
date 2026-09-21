import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "../../store-ui";

export const Route = createFileRoute("/checkout")({
  // A autenticação é validada dentro da tela, após a restauração da sessão.
  // A rota não redireciona durante o carregamento inicial.
  component: CheckoutPage,
});
