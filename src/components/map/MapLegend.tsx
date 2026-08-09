import { changeLegend } from "@/data/layers";

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-card px-4 py-2">
      {changeLegend.map((l) => (
        <div key={l.id} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: l.color }} />
          <span className="text-[11.5px] font-medium text-muted-foreground">{l.label}</span>
        </div>
      ))}
      <span className="ml-auto text-[10.5px] text-muted-foreground">
        Prototype / dummy data · © Ginkgo spatial engine
      </span>
    </div>
  );
}
