import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/change-detection")({ component: ChangeDetection });

function ChangeDetection() {
  return null;
}
