import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/data")({ component: Data });

function Data() {
  return null;
}
