import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Maximize2, RotateCcw, SendHorizonal } from "lucide-react";
import { suggestedPrompts } from "@/services/ai";
import { useGinkgo } from "@/state/ginkgo-store";
import { cn } from "@/lib/utils";
import { AIMessageBubble } from "./AIMessageBubble";
import { SuggestedPrompt } from "./SuggestedPrompt";

export function AICopilot({
  className,
  expandable = true,
}: {
  className?: string | undefined;
  expandable?: boolean | undefined;
}) {
  const { messages, thinking, askCopilot, resetChat } = useGinkgo();
  const [input, setInput] = useState("");
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
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <div className="flex items-center gap-2 border-b border-border bg-card px-3.5 py-2.5">
        <div>
          <div className="text-[13px] font-semibold leading-tight">AI Copilot</div>
          <div className="text-[10.5px] text-muted-foreground">Spatial Planning Agent</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                thinking ? "bg-warning status-pulse" : "bg-success",
              )}
            />
            {thinking ? "Thinking" : "Ready"}
          </span>
          <button
            onClick={resetChat}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="New chat"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          {expandable && (
            <Link
              to="/ai-copilot"
              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Expand copilot"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div ref={scroller} className="flex-1 space-y-3.5 overflow-y-auto px-3.5 py-3.5">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground">
              Ask Ginkgo about the current study area. The agent runs spatial tools, updates the
              map, and explains what it found.
            </p>
            {suggestedPrompts.map((p) => (
              <SuggestedPrompt key={p} text={p} onSelect={submit} />
            ))}
          </div>
        )}
        {messages.map((m) => (
          <AIMessageBubble key={m.id} message={m} />
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary status-pulse" />
            Running spatial analysis...
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this area..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-[12.5px] outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={thinking}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-50"
          aria-label="Send"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
