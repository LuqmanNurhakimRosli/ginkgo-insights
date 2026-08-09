import { Callout } from "@/components/ui/Callout";

export function AISpatialEvidence({
  evidence,
  constraints,
}: {
  evidence?: string[] | undefined;
  constraints?: string[] | undefined;
}) {
  if (!evidence?.length && !constraints?.length) return null;
  return (
    <div className="mt-3 space-y-1.5 font-mono text-[11px]">
      {evidence?.map((e) => (
        <div key={e} className="flex items-start gap-2 text-[#F5F5F4]">
          <span className="text-[#22C55E] font-bold">↗</span>
          <span className="uppercase">{e}</span>
        </div>
      ))}
      {constraints?.map((c) => (
        <div key={c} className="flex items-start gap-2 text-[#F5F5F4]">
          <span className="text-[#F97316] font-bold">↘</span>
          <span className="uppercase">{c}</span>
        </div>
      ))}
    </div>
  );
}
