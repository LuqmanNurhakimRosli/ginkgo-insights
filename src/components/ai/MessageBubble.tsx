import { useState, type ReactNode } from "react";
import { ChevronDown, Cpu, Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/state/ginkgo-store";
import { useGinkgo } from "@/state/ginkgo-store";
import { cn } from "@/lib/utils";

/** Minimal, XSS-safe markdown: **bold**, paragraphs, "- " / "1. " lists. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="space-y-1 pl-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#94a3b8]" />
                  <span>{renderInline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="whitespace-pre-wrap">
            {renderInline(lines.join("\n").replace(/^#+\s*/gm, ""))}
          </p>
        );
      })}
    </div>
  );
}

export function MessageBubble({ message: m }: { message: ChatMessage }) {
  const [open, setOpen] = useState(false);
  const { runCopilotAction } = useGinkgo();
  const isUser = m.role === "user";
  const details = [...(m.evidence ?? []), ...(m.constraints ?? [])];
  return (
    <div className={cn("flex gap-2.5 animate-fade-in", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-white/10" : "bg-white text-[#090a0c]",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-[#cbd5e1]" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
      </div>
      <div className={cn("min-w-0 max-w-[88%] space-y-2", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
            isUser
              ? "rounded-tr-md bg-white text-[#090a0c]"
              : "rounded-tl-md border border-white/[0.08] bg-[#1a1d23] text-[#e2e8f0]",
          )}
        >
          {isUser ? <p className="whitespace-pre-wrap">{m.text}</p> : <RichText text={m.text} />}

          {!isUser && m.evidence && m.evidence.length > 0 && !open && m.evidence.length <= 3 && (
            <ul className="mt-2 space-y-1 border-t border-white/[0.06] pt-2 text-[11.5px] text-[#94a3b8]">
              {m.evidence.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}

          {!isUser && details.length > 3 && (
            <div className="mt-2 border-t border-white/[0.06] pt-2">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1 text-[11.5px] text-[#94a3b8] hover:text-white"
                aria-expanded={open}
              >
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                />
                {open ? "Hide" : "Show"} computed evidence ({details.length})
              </button>
              {open && (
                <ul className="mt-2 space-y-1.5 text-[11.5px] text-[#cbd5e1]">
                  {details.map((e) => (
                    <li key={e} className="flex gap-2">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-white/50" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {m.recommendation && (
            <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/20 p-2.5">
              <div className="mb-1 text-[11.5px] font-semibold text-white">
                {m.recommendation.title}
              </div>
              <ul className="space-y-1 text-[11.5px] text-[#cbd5e1]">
                {m.recommendation.actions.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {!isUser && m.actions && m.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {m.actions.map((a) => (
              <button
                key={a.id}
                onClick={() => runCopilotAction(a)}
                className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-white transition-colors hover:bg-white hover:text-[#090a0c]"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {!isUser && (m.engine || (m.toolCalls && m.toolCalls.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-[#64748b]">
            {m.engine && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" /> {m.engine}
              </span>
            )}
            {m.toolCalls?.map((t) => (
              <span key={t.name} className="rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
