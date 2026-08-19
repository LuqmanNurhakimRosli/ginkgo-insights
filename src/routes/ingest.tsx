import { createFileRoute } from "@tanstack/react-router";
import { IngestFlow } from "@/components/ingest/IngestFlow";

export const Route = createFileRoute("/ingest")({
  head: () => ({
    meta: [
      { title: "GINKGO — INGEST IMAGERY" },
      { name: "description", content: "Upload any satellite scene and let Ginkgo automatically detect, classify, and report on areas of planning interest." },
    ],
  }),
  component: IngestPage,
});

function IngestPage() {
  return (
    <div className="flex h-full w-full flex-col bg-[#090A0C] overflow-hidden">
      <IngestFlow />
    </div>
  );
}
