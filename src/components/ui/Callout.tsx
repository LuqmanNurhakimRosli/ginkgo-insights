import type { ReactNode } from "react";

export type ArrowDirection = "up-right" | "down-right" | "up-left" | "down-left" | "straight" | "up" | "down";

interface CalloutProps {
  label: string;
  value?: string | number;
  direction?: ArrowDirection;
  tone?: "heatmap-low" | "heatmap-moderate" | "heatmap-elevated" | "heatmap-high" | "cyan" | "muted";
  sub?: string;
  className?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

const arrowMap: Record<ArrowDirection, string> = {
  "up-right": "↗",
  "down-right": "↘",
  "up-left": "↖",
  "down-left": "↙",
  straight: "↑",
  up: "↑",
  down: "↓",
};

const toneColorMap = {
  "heatmap-low": "text-[#22C55E]",
  "heatmap-moderate": "text-[#EAB308]",
  "heatmap-elevated": "text-[#F97316]",
  "heatmap-high": "text-[#EF4444]",
  cyan: "text-[#5EEAD4]",
  muted: "text-[#9CA3AF]",
};

export function Callout({
  label,
  value,
  direction = "up-right",
  tone = "cyan",
  sub,
  className = "",
  onClick,
  icon,
}: CalloutProps) {
  const glyph = arrowMap[direction] ?? "↗";
  const textColor = toneColorMap[tone] ?? "text-[#5EEAD4]";

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded border border-white/10 bg-[#16171A] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#F5F5F4] transition-colors ${
        onClick ? "cursor-pointer hover:border-white/20 hover:bg-[#1E2024]" : ""
      } ${className}`}
    >
      {icon && <span className="text-[#9CA3AF]">{icon}</span>}
      <span className="text-[#9CA3AF]">{label}</span>
      {value !== undefined && (
        <span className={`font-semibold num ${textColor}`}>
          {value} {glyph}
        </span>
      )}
      {value === undefined && (
        <span className={`font-semibold ${textColor}`}>{glyph}</span>
      )}
      {sub && <span className="text-[10px] text-[#5B5F66]">{sub}</span>}
    </div>
  );
}
