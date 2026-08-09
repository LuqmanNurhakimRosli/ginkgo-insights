import { createFileRoute } from "@tanstack/react-router";
import { AICopilot } from "@/components/ai/AICopilot";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { PageHeader } from "@/components/layout/AppShell";

export const Route = createFileRoute("/ai-copilot")({
  head: () => ({
    meta: [
      { title: "AI Copilot — Ginkgo Spatial Planning Agent" },
      { name: "description", content: "Ask spatial questions and get evidence-backed planning answers that act on the map." },
      { property: "og:title", content: "AI Copilot — Ginkgo Spatial Planning Agent" },
      { property: "og:description", content: "Ask spatial questions and get evidence-backed planning answers that act on the map." },
    ],
  }),
  component: CopilotPage,
});

function CopilotPage() {
  return (
    <div>
      <PageHeader
        title="AI Copilot"
        subtitle="Ask Ginkgo → Ginkgo analyzes → Ginkgo changes the map → Ginkgo explains why."
      />
      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_460px]">
        <MapWorkspace height="h-[calc(100vh-232px)]" showTime={false} />
        <AICopilot className="h-[calc(100vh-232px)]" expandable={false} />
      </div>
    </div>
  );
}
