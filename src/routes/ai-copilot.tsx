import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, RotateCcw, SendHorizonal, ShieldCheck, Sparkles } from "lucide-react";
import { MessageBubble } from "@/components/ai/MessageBubble";
import { GinkgoMap } from "@/components/map/GinkgoMap";
import { btn, Segmented } from "@/components/gk/ui";
import { providers, suggestedPrompts } from "@/services/ai";
import { useGinkgo } from "@/state/ginkgo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-copilot")({
  head: () => ({
    meta: [
      { title: "Planning copilot — Ginkgo" },
      {
        name: "description",
        content:
          "Ask questions about the analysed area. Answers are grounded in computed GIS results.",
      },
    ],
  }),
  component: CopilotPage,
});

function CopilotPage() {
  const { messages, thinking, askCopilot, resetChat, analysis, settings, updateSettings, status } =
    useGinkgo();
  const [input, setInput] = useState("");
  const [view, setView] = useState<"chat" | "map">("chat");
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const provider = providers[settings.providerId] ?? providers["analyst"]!;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const submit = (text: string) => {
    const v = text.trim();
    if (!v || thinking) return;
    setInput("");
    void askCopilot(v);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col border-white/[0.08] lg:w-[460px] lg:flex-none lg:border-r",
          view === "map" && "hidden lg:flex",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[14px] font-semibold">
              <Sparkles className="h-4 w-4" /> Planning copilot
            </div>
            <div className="truncate text-[11.5px] text-[#94a3b8]">
              {analysis ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {analysis.aoi.name}
                </span>
              ) : status === "running" ? (
                "Analysis running…"
              ) : (
                "No area analysed — answers will guide you to start"
              )}
            </div>
          </div>
          <select
            value={settings.providerId}
            onChange={(e) => updateSettings({ providerId: e.target.value })}
            className="max-w-[150px] rounded-lg border border-white/[0.12] bg-[#0f1115] px-2 py-1.5 text-[12px] text-white outline-none"
            aria-label="Copilot engine"
          >
            {Object.values(providers).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={resetChat}
            className={btn.icon}
            title="New conversation"
            aria-label="New conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="lg:hidden">
          <div className="px-4 pt-3">
            <Segmented
              className="w-full [&>button]:flex-1"
              value={view}
              onChange={setView}
              options={[
                { value: "chat", label: "Chat" },
                { value: "map", label: "Map" },
              ]}
            />
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scroller}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 scroll-thin"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex gap-2.5 rounded-xl border border-white/[0.08] bg-[#14161b] p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                <p className="text-[12px] leading-relaxed text-[#cbd5e1]">
                  The copilot explains numbers that Ginkgo's GIS engine has already computed for the
                  selected area. It never creates scores.
                  <span className="mt-1 block text-[#94a3b8]">Engine: {provider.description}</span>
                </p>
              </div>
              <div>
                <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Try asking
                </div>
                <div className="grid gap-1.5">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left text-[12.5px] text-[#e2e8f0] transition-colors hover:border-white/25 hover:bg-white/[0.05]"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-[12px] text-[#94a3b8]">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse-soft"
                    style={{ animationDelay: `${i * 160}ms` }}
                  />
                ))}
              </span>
              Reading computed results…
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="border-t border-white/[0.08] p-3"
        >
          <div className="flex items-end gap-2 rounded-xl border border-white/[0.12] bg-[#0f1115] p-1.5 focus-within:border-white/40">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              placeholder={
                analysis
                  ? `Ask about ${analysis.aoi.name}…`
                  : "Ask how Ginkgo works, or analyse an area first…"
              }
              aria-label="Message"
              className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-white outline-none placeholder:text-[#64748b]"
            />
            <button
              type="submit"
              disabled={thinking || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#090a0c] disabled:opacity-30"
              aria-label="Send"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      <div className={cn("relative min-h-0 flex-1", view === "chat" && "hidden lg:block")}>
        <GinkgoMap />
        <div className="absolute left-3 top-3 z-[1000] lg:hidden">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "chat", label: "Chat" },
              { value: "map", label: "Map" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
