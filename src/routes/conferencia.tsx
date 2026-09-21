import { createFileRoute } from "@tanstack/react-router";
import { ConferencePage } from "../../store-ui";

export const Route = createFileRoute("/conferencia")({ component: ConferencePage });
