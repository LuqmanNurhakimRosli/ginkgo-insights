import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Maximize2, RotateCcw, SendHorizonal, Minus } from "lucide-react";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { suggestedPrompts } from "@/services/ai";
import { AIMessageBubble } from "./AIMessageBubble";

export function AIDock() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const { messages, thinking, askCopilot, resetChat } = useGinkgo();
  const selectedSite = useSelectedSite();
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, thinking, open, minimized]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    setInput("");
    void askCopilot(value);
  };

  return (
    <>
      {/* Compact Launcher — Bottom Left */}
      {!open && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2.5 glass-panel rounded-xl px-4 py-2.5 hover:bg-[#1e2129] transition-all group"
          >
            <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Spatial Copilot</span>
            {thinking && (
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* Expanded Chat Panel */}
      {open && !minimized && (
        <div className="fixed bottom-6 left-6 z-50 w-[380px] h-[500px] flex flex-col glass-panel rounded-2xl overflow-hidden animate-slide-up shadow-2xl border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#14161b]">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Spatial Copilot</span>
                <p className="text-[10px] text-[#94a3b8] leading-none mt-0.5">
                  {thinking ? "Reasoning..." : `Sector: ${selectedSite.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={resetChat}
                title="Reset"
                className="rounded-md p-1.5 text-[#94a3b8] hover:bg-white/5 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMinimized(true)}
                title="Minimize"
                className="rounded-md p-1.5 text-[#94a3b8] hover:bg-white/5 hover:text-white transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="rounded-md p-1.5 text-[#94a3b8] hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Ask questions regarding land suitability, flood exposure buffers, arterial access, and statutory guidelines.
                </p>
                <div className="space-y-1.5">
                  {suggestedPrompts.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="block w-full text-left rounded-xl border border-white/6 bg-white/3 px-3 py-2.5 text-xs text-[#94a3b8] transition-colors hover:border-white/20 hover:text-white hover:bg-white/5"
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
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs text-[#94a3b8]">Analyzing spatial layers...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/8 p-3 bg-[#101217]">
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
                placeholder="Query spatial assistant..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-[#64748b] outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#090a0c] transition-opacity disabled:opacity-30 hover:bg-white/90"
              >
                <SendHorizonal className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Minimized State */}
      {open && minimized && (
        <div className="fixed bottom-6 left-6 z-50">
          <button
            onClick={() => setMinimized(false)}
            className="flex items-center gap-2.5 glass-panel rounded-xl px-4 py-2.5 hover:bg-[#1e2129] transition-all"
          >
            <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Spatial Copilot</span>
            <Maximize2 className="h-3 w-3 text-[#94a3b8]" />
          </button>
        </div>
      )}
    </>
  );
}
