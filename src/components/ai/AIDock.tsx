import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, Maximize2, RotateCcw, SendHorizonal, MapPin } from "lucide-react";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { suggestedPrompts } from "@/services/ai";
import { AIMessageBubble } from "./AIMessageBubble";

export function AIDock() {
  const [open, setOpen] = useState(false);
  const { messages, thinking, askCopilot, resetChat } = useGinkgo();
  const selectedSite = useSelectedSite();
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, thinking, open]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    setInput("");
    void askCopilot(value);
  };

  return (
    <>
      {/* Sleek Compact Launcher Widget (Positioned cleanly bottom-right, clear of metrics) */}
      {!open && (
        <div className="fixed bottom-14 right-6 z-40">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[#5EEAD4]/40 bg-[#16171A]/95 px-3.5 py-2 shadow-2xl backdrop-blur transition-all hover:scale-105 hover:border-[#5EEAD4] hover:bg-[#1E2024]"
          >
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  thinking ? "animate-cyan-pulse bg-[#5EEAD4]" : "bg-[#5EEAD4]"
                }`}
              />
            </span>
            <Sparkles className="h-4 w-4 text-[#5EEAD4]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F5F5F4]">
              {thinking ? "ANALYZING..." : "AI COPILOT"}
            </span>
          </button>
        </div>
      )}

      {/* Expanded Slide-out Drawer Overlay */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-white/10 bg-[#16171A]/95 backdrop-blur-xl shadow-2xl transition-all">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#5EEAD4] animate-cyan-pulse" />
              <div>
                <span className="font-mono text-[12px] uppercase tracking-widest text-[#F5F5F4]">
                  AI SPATIAL COPILOT
                </span>
                <p className="text-[10px] text-[#9CA3AF]">PARSING REAL-TIME GIS CONTEXT</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Reset conversation"
                className="rounded p-1.5 text-[#9CA3AF] hover:bg-white/5 hover:text-[#F5F5F4]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <Link
                to="/ai-copilot"
                title="Full-screen Workspace"
                className="rounded p-1.5 text-[#9CA3AF] hover:bg-white/5 hover:text-[#F5F5F4]"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1.5 text-[#9CA3AF] hover:bg-white/5 hover:text-[#F5F5F4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Active Context Bar */}
          <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-[#5EEAD4]" />
              <span>ACTIVE LOCATION: {selectedSite ? selectedSite.name : "PUTRAJAYA"}</span>
            </div>
            <span className="text-[#5EEAD4]">{thinking ? "THINKING..." : "IDLE"}</span>
          </div>

          {/* Message List */}
          <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[12px] leading-relaxed text-[#9CA3AF]">
                  Query Ginkgo to trigger automated spatial intersection, risk modeling, and map view adjustments.
                </p>
                <div className="space-y-1.5">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="block w-full text-left rounded border border-white/5 bg-white/5 p-2.5 text-[11px] text-[#F5F5F4] transition-colors hover:border-[#5EEAD4]/30 hover:bg-white/10"
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
              <div className="flex items-center gap-2 rounded border border-white/5 bg-black/40 p-3 font-mono text-[11px] text-[#9CA3AF]">
                <span className="h-2 w-2 rounded-full bg-[#5EEAD4] animate-cyan-pulse" />
                <span>Checking flood risk and accessibility data...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 bg-[#0B0C0E]/60 p-3">
            {selectedSite && (
              <div className="mb-2 inline-flex items-center gap-1 rounded bg-[#5EEAD4]/10 px-2 py-0.5 font-mono text-[10px] uppercase text-[#5EEAD4]">
                <MapPin className="h-2.5 w-2.5" />
                <span>{selectedSite.name} ({selectedSite.id})</span>
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
                placeholder="PROMPT COPILOT..."
                className="w-full rounded border border-white/10 bg-[#16171A] px-3 py-2 font-mono text-[12px] text-[#F5F5F4] placeholder-[#5B5F66] outline-none focus:border-[#5EEAD4]"
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#5EEAD4] text-[#0B0C0E] transition-opacity disabled:opacity-40"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
