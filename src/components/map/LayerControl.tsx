import { Layers, X } from "lucide-react";
import { useState } from "react";
import { layers } from "@/data/layers";
import { useGinkgo } from "@/state/ginkgo-store";

export function LayerControl() {
  const { activeLayers, toggleLayer } = useGinkgo();
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="ginkgo-float flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium"
      >
        <Layers className="h-3.5 w-3.5 text-primary" /> Layers
      </button>
    );
  }

  return (
    <div className="ginkgo-float w-60">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[12.5px] font-semibold">Layers</span>
        <button onClick={() => setOpen(false)} aria-label="Close layers">
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      <div className="max-h-[280px] space-y-0.5 overflow-y-auto p-2">
        {layers.map((l) => {
          const checked = activeLayers.includes(l.id);
          return (
            <label
              key={l.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-[12.5px] transition-colors hover:bg-secondary"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleLayer(l.id)}
                className="h-3.5 w-3.5 accent-[var(--color-primary)]"
              />
              <span className="flex-1 leading-tight">{l.label}</span>
              <span
                className="h-2 w-2 rounded-[2px]"
                style={{ backgroundColor: l.color, opacity: checked ? 1 : 0.25 }}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
