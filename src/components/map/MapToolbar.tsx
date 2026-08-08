import { Home, Minus, Plus, Ruler, SplitSquareHorizontal } from "lucide-react";
import { useGinkgo } from "@/state/ginkgo-store";

export function MapToolbar({ onCompare }: { onCompare?: () => void }) {
  const { zoom, setZoom, resetView } = useGinkgo();

  const btn =
    "flex h-8 w-8 items-center justify-center border-b border-border text-muted-foreground transition-colors last:border-b-0 hover:bg-secondary hover:text-foreground";

  return (
    <div className="ginkgo-float overflow-hidden">
      <button className={btn} onClick={() => setZoom(zoom + 0.25)} aria-label="Zoom in">
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={() => setZoom(zoom - 0.25)} aria-label="Zoom out">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={resetView} aria-label="Reset view">
        <Home className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={onCompare} aria-label="Compare T1 and T2">
        <SplitSquareHorizontal className="h-3.5 w-3.5" />
      </button>
      <button className={btn} aria-label="Measure">
        <Ruler className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
