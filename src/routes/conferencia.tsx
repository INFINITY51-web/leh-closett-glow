import { createFileRoute } from "@tanstack/react-router";
import { ConferencePage } from "../../store-ui";

export const Route = createFileRoute("/conferencia")({
  // A sessão deve ser lida pela ação de finalização, não pela guarda da rota.
  component: ConferencePage,
});
