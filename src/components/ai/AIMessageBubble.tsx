import { GinkgoMark } from "@/components/brand/GinkgoLogo";
import type { AIMessage } from "@/types";
import { AISpatialEvidence } from "./AISpatialEvidence";
import { AIToolAction } from "./AIToolAction";

export function AIMessageBubble({ message }: { message: AIMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end fade-up">
        <div className="max-w-[86%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-[12.5px] leading-snug text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="mb-1.5 flex items-center gap-2">
        <GinkgoMark className="h-4.5 w-4.5" />
        <span className="text-[12px] font-semibold">Ginkgo</span>
      </div>

      {message.toolCalls?.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {message.toolCalls.map((t) => (
            <span
              key={t.name}
              className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {t.name}()
            </span>
          ))}
        </div>
      ) : null}

      <div className="rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5">
        <p className="whitespace-pre-line text-[12.5px] leading-relaxed">{message.text}</p>
        <AISpatialEvidence evidence={message.evidence} constraints={message.constraints} />

        {message.recommendation && (
          <div className="mt-3 rounded-md border border-primary/25 bg-primary-soft px-3 py-2.5">
            <div className="label-caps mb-1 text-accent-foreground">
              {message.recommendation.title}
            </div>
            <ol className="list-decimal space-y-1 pl-4 text-[12.5px] leading-snug">
              {message.recommendation.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        <AIToolAction actions={message.actions} features={message.features} />
      </div>
    </div>
  );
}
