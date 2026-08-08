import { useState } from "react";
import { useGinkgo } from "@/state/ginkgo-store";
import { MapCanvas } from "./MapCanvas";

/** Swipe comparison between the T1 and T2 composites. */
export function MapComparison({ mode = "swipe" }: { mode?: "swipe" | "side" }) {
  const { t1, t2 } = useGinkgo();
  const [pos, setPos] = useState(50);

  if (mode === "side") {
    return (
      <div className="grid h-full grid-cols-2 gap-px bg-border">
        <div className="relative">
          <MapCanvas interactive={false} />
          <Tag label={`T1 · ${t1}`} />
        </div>
        <div className="relative">
          <MapCanvas overlay="change" />
          <Tag label={`T2 · ${t2}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapCanvas interactive={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <MapCanvas overlay="change" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-white/80"
        style={{ left: `${pos}%` }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare T1 and T2"
        className="absolute bottom-6 left-1/2 w-1/2 -translate-x-1/2 accent-[var(--color-primary)]"
      />
      <Tag label={`T1 · ${t1}`} />
      <Tag label={`T2 · ${t2}`} right />
    </div>
  );
}

function Tag({ label, right }: { label: string; right?: boolean }) {
  return (
    <span
      className={`absolute bottom-3 ${right ? "right-3" : "left-3"} rounded bg-black/55 px-2 py-1 text-[11px] font-medium text-white`}
    >
      {label}
    </span>
  );
}
