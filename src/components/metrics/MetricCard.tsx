import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { SpatialMetric } from "@/types";
import { cn } from "@/lib/utils";

const toneClass: Record<string, string> = {
  positive: "text-success",
  negative: "text-destructive",
  warning: "text-warning",
  neutral: "text-muted-foreground",
};

export function MetricCard({ metric, icon }: { metric: SpatialMetric; icon?: ReactNode }) {
  const Arrow =
    metric.direction === "up" ? ArrowUp : metric.direction === "down" ? ArrowDown : Minus;
  return (
    <div className="ginkgo-panel px-4 py-3.5 transition-shadow hover:shadow-[var(--shadow-panel)]">
      <div className="flex items-center gap-2">
        {icon}
        <span className="label-caps">{metric.label}</span>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="num text-[24px] font-bold leading-none tracking-tight">{metric.value}</span>
        {metric.unit && (
          <span className="pb-0.5 text-[12px] text-muted-foreground">{metric.unit}</span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Arrow className={cn("h-3 w-3", toneClass[metric.tone ?? "neutral"])} />
        <span className={cn("text-[11.5px] font-medium", toneClass[metric.tone ?? "neutral"])}>
          {metric.delta}
        </span>
        {metric.sub && (
          <span className="ml-auto text-[10.5px] text-muted-foreground">{metric.sub}</span>
        )}
      </div>
    </div>
  );
}

export function ProgressMetric({
  label,
  value,
  max = 100,
  note,
  color = "var(--color-primary)",
}: {
  label: string;
  value: number;
  max?: number;
  note?: string;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="num text-[12.5px] font-medium text-muted-foreground">
          {value}/{max}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      {note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}

export function ScoreCard({
  score,
  band,
  label,
  suffix = "/100",
}: {
  score: number;
  band: string;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="ginkgo-panel flex items-center gap-4 px-4 py-4">
      <div>
        <div className="label-caps">{label}</div>
        <div className="mt-1 flex items-end gap-1.5">
          <span className="num text-[40px] font-bold leading-none tracking-tight text-primary">{score}</span>
          <span className="pb-1.5 text-[13px] text-muted-foreground">{suffix}</span>
        </div>
      </div>
      <span className="ml-auto rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-accent-foreground">
        {band}
      </span>
    </div>
  );
}

export function EvidenceCard({
  title,
  positives,
  negatives,
  footer,
}: {
  title: string;
  positives: string[];
  negatives: string[];
  footer?: ReactNode;
}) {
  return (
    <div className="ginkgo-panel px-4 py-4">
      <h3 className="text-[16px] font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-[13px] leading-snug">
        {positives.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="text-success">+</span>
            <span>{p}</span>
          </li>
        ))}
        {negatives.map((n) => (
          <li key={n} className="flex gap-2">
            <span className="text-destructive">−</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
