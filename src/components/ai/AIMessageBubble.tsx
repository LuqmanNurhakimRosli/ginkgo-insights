import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AIMessage } from "@/types";
import { cn } from "@/lib/utils";
import { AISpatialEvidence } from "./AISpatialEvidence";
import { AIToolAction } from "./AIToolAction";

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
  highlightFeatures: "Updated map highlights",
  zoomToFeatures: "Recentred camera",
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
    <div className="mt-3 border-t border-white/5 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF] hover:text-[#F5F5F4]"
      >
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        Show calculation trace
      </button>
      {open && (
        <ol className="mt-2 space-y-1 font-mono text-[10px] text-[#9CA3AF]">
          {names.map((n) => (
            <li key={n} className="flex items-center gap-1.5">
              <span className="text-[#5EEAD4]">•</span>
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
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded border border-[#5EEAD4]/30 bg-[#5EEAD4]/10 p-3 text-[12.5px] leading-relaxed text-[#F5F5F4]">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#9CA3AF]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5EEAD4]" />
        <span>GINKGO COPILOT</span>
      </div>

      <div className="rounded border border-white/10 bg-[#16171A] p-3.5 text-[#F5F5F4]">
        <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-[#F5F5F4]">{message.text}</p>

        <AISpatialEvidence evidence={message.evidence} constraints={message.constraints} />

        {message.recommendation && (
          <div className="mt-3 rounded border border-[#5EEAD4]/20 bg-[#5EEAD4]/5 p-3">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#5EEAD4]">
              {message.recommendation.title}
            </div>
            <ol className="mt-1 space-y-1 font-mono text-[11px] text-[#F5F5F4]">
              {message.recommendation.actions.map((a) => (
                <li key={a} className="flex items-start gap-1.5">
                  <span className="text-[#5EEAD4]">↗</span>
                  <span>{a}</span>
                </li>
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
