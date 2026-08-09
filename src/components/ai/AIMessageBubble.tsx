import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { GinkgoMark } from "@/components/brand/GinkgoLogo";
import type { AIMessage } from "@/types";
import { cn } from "@/lib/utils";
import { AISpatialEvidence } from "./AISpatialEvidence";
import { AIToolAction } from "./AIToolAction";

/** Human-readable label for an internal tool call. Never show raw code to users. */
const toolLabels: Record<string, string> = {
  getSuitabilityScore: "Reviewed development suitability scoring",
  getLivability: "Reviewed livability dimensions",
  getLivabilityScore: "Reviewed livability dimensions",
  getAccessibility: "Checked road access and connectivity",
  getFloodRisk: "Checked flood exposure indicators",
  getChangeDetection: "Compared temporal satellite composites",
  getLandCover: "Analysed land cover composition",
  getLoadData: "Loaded study-area datasets",
  getSite: "Loaded parcel attributes",
  highlightFeatures: "Updated the map highlights",
  zoomToFeatures: "Recentred the map",
};

function humanise(name: string) {
  if (toolLabels[name]) return toolLabels[name];
  const words = name
    .replace(/^get/, "")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
  return `Checked ${words} data`;
}

function ReasoningTrail({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-border pt-2.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        Show how this was calculated
      </button>
      {open && (
        <ol className="mt-2 space-y-1.5 pl-5 text-[12px] leading-snug text-muted-foreground">
          {names.map((n) => (
            <li key={n} className="list-decimal">
              {humanise(n)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AIMessageBubble({ message }: { message: AIMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end fade-up">
        <div className="max-w-[86%] rounded-lg rounded-br-sm bg-primary px-4 py-3 text-[13px] leading-relaxed text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="mb-2 flex items-center gap-2">
        <GinkgoMark className="h-4.5 w-4.5" />
        <span className="text-[12.5px] font-semibold">Ginkgo</span>
      </div>

      <div className="rounded-lg rounded-tl-sm border border-border bg-card px-4 py-3.5">
        <p className="whitespace-pre-line text-[13px] leading-relaxed">{message.text}</p>
        <AISpatialEvidence evidence={message.evidence} constraints={message.constraints} />

        {message.recommendation && (
          <div className="mt-3.5 rounded-md border border-primary/25 bg-primary-soft px-3.5 py-3">
            <div className="label-caps mb-1.5 text-accent-foreground">
              {message.recommendation.title}
            </div>
            <ol className="list-decimal space-y-1 pl-4 text-[13px] leading-snug">
              {message.recommendation.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        <AIToolAction actions={message.actions} features={message.features} />

        {message.toolCalls?.length ? (
          <ReasoningTrail names={message.toolCalls.map((t) => t.name)} />
        ) : null}
      </div>
    </div>
  );
}
