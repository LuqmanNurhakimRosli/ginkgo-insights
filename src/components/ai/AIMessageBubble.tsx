import { useState } from "react";
import type { AIMessage } from "@/types";
import { ChevronDown, ChevronUp, User, Sparkles } from "lucide-react";

export function AIMessageBubble({ message: m }: { message: AIMessage }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const isUser = m.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${
          isUser ? "bg-white/10" : "bg-white/20 border border-white/20"
        }`}
      >
        {isUser ? (
          <User className="h-3 w-3 text-[#94a3b8]" />
        ) : (
          <Sparkles className="h-3 w-3 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? "bg-white/15 text-white border border-white/10"
            : "bg-white/5 text-[#f1f5f9] border border-white/5"
        }`}
      >
        <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>

        {/* Evidence / Reasoning */}
        {m.evidence && m.evidence.length > 0 && (
          <div className="mt-2 border-t border-white/6 pt-2">
            <button
              onClick={() => setShowEvidence((s) => !s)}
              className="flex items-center gap-1.5 text-[10px] text-[#94a3b8] hover:text-white transition-colors"
            >
              {showEvidence ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span>{showEvidence ? "Hide" : "Show"} reasoning ({m.evidence.length} points)</span>
            </button>

            {showEvidence && (
              <ul className="mt-2 space-y-1.5">
                {m.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px] text-[#94a3b8]">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Recommendation */}
        {m.recommendation && (
          <div className="mt-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <p className="text-[10px] font-semibold text-white mb-1">{m.recommendation.title}</p>
            <ul className="space-y-1">
              {m.recommendation.actions.map((a, i) => (
                <li key={i} className="text-[10px] text-[#94a3b8]">• {a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tool calls */}
        {m.toolCalls && m.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {m.toolCalls.map((tc, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-[#94a3b8]"
              >
                <span className="h-1 w-1 rounded-full bg-[#10b981]" />
                {tc.name.replace(/([A-Z])/g, " $1").trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
