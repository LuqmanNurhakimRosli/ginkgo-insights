import { Check, TriangleAlert } from "lucide-react";

export function AISpatialEvidence({
  evidence,
  constraints,
}: {
  evidence?: string[] | undefined;
  constraints?: string[] | undefined;
}) {
  if (!evidence?.length && !constraints?.length) return null;
  return (
    <div className="mt-2.5 space-y-1.5">
      {evidence?.map((e) => (
        <div key={e} className="flex gap-2 text-[12.5px] leading-snug">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{e}</span>
        </div>
      ))}
      {constraints?.map((c) => (
        <div key={c} className="flex gap-2 text-[12.5px] leading-snug">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span>{c}</span>
        </div>
      ))}
    </div>
  );
}
