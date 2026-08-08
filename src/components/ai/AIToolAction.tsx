import { useNavigate } from "@tanstack/react-router";
import { Crosshair, FileText, Layers, Maximize2, Scale } from "lucide-react";
import { useGinkgo } from "@/state/ginkgo-store";
import type { MapAction, MapFeature } from "@/types";

const icons = {
  highlight: Crosshair,
  zoom: Maximize2,
  layer: Layers,
  compare: Scale,
  report: FileText,
  navigate: Maximize2,
};

export function AIToolAction({
  actions,
  features,
}: {
  actions?: MapAction[] | undefined;
  features?: MapFeature[] | undefined;
}) {
  const { runMapAction } = useGinkgo();
  const navigate = useNavigate();
  if (!actions?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((a) => {
        const Icon = icons[a.kind];
        return (
          <button
            key={a.id}
            onClick={() => {
              if (a.kind === "navigate") {
                const to = a.payload?.["to"];
                if (typeof to === "string") void navigate({ to });
                return;
              }
              if (a.kind === "report") {
                void navigate({ to: "/reports" });
                return;
              }
              runMapAction(a, features);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary-soft px-2.5 py-1.5 text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
