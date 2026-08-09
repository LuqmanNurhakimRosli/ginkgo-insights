import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { MapCanvas } from "@/components/map/MapCanvas";
import { AIMessageBubble } from "@/components/ai/AIMessageBubble";
import { suggestedPrompts } from "@/services/ai";
import { MapPin, RotateCcw, SendHorizonal, Sparkles, BookOpen, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/ai-copilot")({
  head: () => ({
    meta: [
      { title: "GINKGO — COPILOT WORKSPACE" },
      {
        name: "description",
        content: "Full-screen AI agent workspace for conversational spatial analysis.",
      },
    ],
  }),
  component: CopilotWorkspaceView,
});

const promptCategories = [
  {
    category: "🛰️ SATELLITE CHANGE DETECTION",
    prompts: [
      "Show areas with the highest built-up growth",
      "Where is vegetation loss highest between 2023 and 2025?",
      "Compare satellite T1 and T2 composites for Putrajaya",
    ],
  },
  {
    category: "🌊 FLOOD RISK & HAZARD SCREENING",
    prompts: [
      "Check flood exposure indicators for Sungai Buah floodplain",
      "Is Site C suitable for housing despite flood exposure?",
    ],
  },
  {
    category: "🏘️ SUSTAINABLE DEVELOPMENT SUITABILITY",
    prompts: [
      "Where should sustainable housing development be prioritized?",
      "Why is Site A's livability score 84?",
      "Compare Site A and Site B suitability criteria",
    ],
  },
  {
    category: "📋 AUTOMATED REPORT GENERATION",
    prompts: [
      "Generate a complete spatial planning assessment report",
      "Which areas have poor road accessibility?",
    ],
  },
];

function CopilotWorkspaceView() {
  const { messages, thinking, askCopilot, resetChat } = useGinkgo();
  const selectedSite = useSelectedSite();
  const [input, setInput] = useState("");
  const [showInstructions, setShowInstructions] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    setInput("");
    void askCopilot(value);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0B0C0E]">
      {/* Subheader Toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-white/10 px-4 font-mono text-[11px] uppercase tracking-widest text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#5EEAD4]" />
          <span className="font-bold text-[#F5F5F4]">VIEW 3 // COPILOT AGENT WORKSPACE</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <button
            onClick={() => setShowInstructions((s) => !s)}
            className="flex items-center gap-1.5 rounded border border-[#5EEAD4]/30 bg-[#5EEAD4]/10 px-2.5 py-1 text-[#5EEAD4] hover:bg-[#5EEAD4]/20"
          >
            <BookOpen className="h-3 w-3" />
            <span>PROMPT GUIDE & SYSTEM INSTRUCTIONS</span>
          </button>

          <span>STATUS: <span className="text-[#5EEAD4]">{thinking ? "EXECUTING SPATIAL QUERY..." : "ONLINE & READY"}</span></span>
          <button
            onClick={resetChat}
            className="flex items-center gap-1 text-[#9CA3AF] hover:text-[#F5F5F4]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>RESET CHAT</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Conversation (480px) */}
        <div className="flex w-[480px] shrink-0 flex-col border-r border-white/10 bg-[#16171A]">
          {/* Expandable Instruction & Prompt Preset Guide */}
          {showInstructions && (
            <div className="border-b border-white/10 bg-black/40 p-4 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[#5EEAD4] mb-2 font-bold uppercase tracking-wider text-[10px]">
                <span>SYSTEM INSTRUCTION GUIDE</span>
                <button onClick={() => setShowInstructions(false)} className="text-[#9CA3AF] hover:text-white">
                  <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                </button>
              </div>
              <p className="text-[10px] text-[#9CA3AF] leading-relaxed mb-3">
                Ginkgo Copilot translates natural language spatial instructions into live map actions (camera flying, feature highlighting, layer switching, and score justification).
              </p>

              <div className="space-y-2">
                <span className="text-[9px] text-[#5B5F66] uppercase block font-semibold">CLICK A PRESET SPATIAL PROMPT:</span>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {promptCategories.map((cat) => (
                    <div key={cat.category}>
                      <span className="text-[9px] text-[#5EEAD4] font-semibold block mb-1">{cat.category}</span>
                      <div className="space-y-1">
                        {cat.prompts.map((p) => (
                          <button
                            key={p}
                            onClick={() => submit(p)}
                            className="block w-full text-left rounded border border-white/5 bg-white/5 px-2.5 py-1.5 text-[10px] text-[#F5F5F4] transition-all hover:border-[#5EEAD4]/40 hover:bg-[#5EEAD4]/10"
                          >
                            • {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Scroller */}
          <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded border border-white/10 bg-black/20 p-3 font-mono text-[11px] text-[#9CA3AF]">
                  Ask Ginkgo spatial questions. The agent executes GIS tools, updates map layers, highlights features, and justifies every recommendation.
                </div>
                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase text-[#5B5F66]">SUGGESTED SPATIAL QUERIES:</span>
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="block w-full text-left rounded border border-white/5 bg-white/5 p-3 font-mono text-[11px] text-[#F5F5F4] transition-all hover:border-[#5EEAD4]/40 hover:bg-white/10"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <AIMessageBubble key={m.id} message={m} />
            ))}

            {thinking && (
              <div className="flex items-center gap-2 rounded border border-[#5EEAD4]/30 bg-[#5EEAD4]/5 p-3 font-mono text-[11px] text-[#5EEAD4]">
                <span className="h-2 w-2 rounded-full bg-[#5EEAD4] animate-cyan-pulse" />
                <span>Parsing spatial constraints and computing intersection...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="border-t border-white/10 bg-[#0B0C0E] p-3">
            {selectedSite && (
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase text-[#9CA3AF]">
                <div className="inline-flex items-center gap-1 rounded bg-[#5EEAD4]/10 px-2 py-0.5 text-[#5EEAD4]">
                  <MapPin className="h-3 w-3" />
                  <span>LOCATION CONTEXT: {selectedSite.name}</span>
                </div>
                <span>PARCEL ID: {selectedSite.id}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="TYPE SPATIAL INSTRUCTION OR QUESTION..."
                className="w-full rounded border border-white/10 bg-[#16171A] px-3.5 py-2.5 font-mono text-[12px] text-[#F5F5F4] placeholder-[#5B5F66] outline-none focus:border-[#5EEAD4]"
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#5EEAD4] text-[#0B0C0E] transition-opacity disabled:opacity-40"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Live Interactive Map Canvas */}
        <div className="relative flex-1 overflow-hidden bg-[#0B0C0E]">
          <MapCanvas overlay="suitability" />
        </div>
      </div>
    </div>
  );
}
