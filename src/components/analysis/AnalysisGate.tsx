import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MapPinned } from "lucide-react";
import { PRESET_AREAS } from "@/data/presets";
import { useGinkgo } from "@/state/ginkgo-store";
import type { AreaAnalysis } from "@/types/geo";
import { btn, EmptyState } from "@/components/gk/ui";
import { ErrorPanel, RunningPanel } from "./AnalysisPanel";

/** Renders children only when an analysis is available; otherwise a consistent empty / progress state. */
export function AnalysisGate({
  children,
  what,
}: {
  children: (a: AreaAnalysis) => ReactNode;
  what: string;
}) {
  const { analysis, status, runPreset } = useGinkgo();
  if (status === "running")
    return (
      <div className="mx-auto max-w-md py-6">
        <RunningPanel />
      </div>
    );
  if (status === "error" && !analysis)
    return (
      <div className="mx-auto max-w-md py-6">
        <ErrorPanel />
      </div>
    );
  if (!analysis)
    return (
      <EmptyState
        icon={<MapPinned className="h-5 w-5" />}
        title="No area analysed yet"
        body={
          <>
            {what} is computed for the area you select on the map. Draw an area, or start with a
            quick area below.
          </>
        }
        actions={
          <div className="flex w-full flex-col gap-2">
            <Link to="/" className={btn.primary}>
              Open map workspace
            </Link>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AREAS.slice(0, 4).map((p) => (
                <button key={p.id} onClick={() => runPreset(p.id)} className={btn.secondary}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        }
      />
    );
  return <>{children(analysis)}</>;
}
