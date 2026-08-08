import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-copilot")({ component: AiCopilot });

function AiCopilot() {
  return null;
}
