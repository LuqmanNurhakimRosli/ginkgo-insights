import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/analysis")({ component: Analysis });

function Analysis() {
  return null;
}
