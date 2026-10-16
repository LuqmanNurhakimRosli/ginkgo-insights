import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CircleDot, Loader2, XCircle } from "lucide-react";
import { RISK_COLORS } from "@/lib/geo/flood";
import { cn } from "@/lib/utils";
import type { RiskClass, SuitabilityClass } from "@/types/geo";

export function scoreColor(score: number) {
  if (score >= 70) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export const SUITABILITY_COLORS: Record<SuitabilityClass, string> = {
  "Highly Suitable": "#10B981",
  Suitable: "#38BDF8",
  Conditional: "#F59E0B",
  "Low Suitability": "#EF4444",
};

export function Panel({
  className,
  children,
  as: As = "section",
}: {
  className?: string;
  children: ReactNode;
  as?: "section" | "div" | "article";
}) {
  return (
    <As className={cn("rounded-xl border border-white/[0.08] bg-[#14161b]", className)}>
      {children}
    </As>
  );
}

export function PanelHeader({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-white">
          {icon}
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-[11.5px] leading-snug text-[#94a3b8]">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#64748b]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  color,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  color?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.06] bg-[#0f1115] px-3 py-2.5">
      <div className="truncate text-[11px] text-[#94a3b8]">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className="num truncate text-[19px] font-semibold leading-tight"
          style={color ? { color } : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-[11px] text-[#64748b]">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 truncate text-[10.5px] text-[#64748b]">{sub}</div>}
    </div>
  );
}

export function Bar({
  value,
  max = 100,
  color = "#fff",
  className,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      role="presentation"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function ScoreRing({
  score,
  size = 76,
  label,
  color,
}: {
  score: number;
  size?: number;
  label?: string;
  color?: string;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = color ?? scoreColor(score);
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"} ${score} of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-semibold leading-none" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
        <span className="mt-0.5 text-[9px] text-[#64748b]">/100</span>
      </div>
    </div>
  );
}

export function RiskBadge({ cls, size = "sm" }: { cls: RiskClass; size?: "sm" | "md" }) {
  const c = RISK_COLORS[cls];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "md" ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[10.5px]",
      )}
      style={{ color: c, borderColor: `${c}55`, backgroundColor: `${c}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
      {cls}
    </span>
  );
}

export function ClassBadge({ cls }: { cls: SuitabilityClass }) {
  const c = SUITABILITY_COLORS[cls];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ color: c, borderColor: `${c}55`, backgroundColor: `${c}14` }}
    >
      {cls}
    </span>
  );
}

export function FlagIcon({ status }: { status: "pass" | "watch" | "fail" }) {
  if (status === "pass")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10b981]" aria-label="Pass" />;
  if (status === "watch")
    return <AlertTriangle className="h-4 w-4 shrink-0 text-[#f59e0b]" aria-label="Watch" />;
  return <XCircle className="h-4 w-4 shrink-0 text-[#ef4444]" aria-label="Fail" />;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = "sm",
}: {
  value: T;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-white/[0.08] bg-[#0b0c0f] p-0.5",
        className,
      )}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "whitespace-nowrap rounded-md font-medium transition-colors",
            size === "md" ? "px-3 py-1.5 text-[12.5px]" : "px-2.5 py-1 text-[12px]",
            value === o.value ? "bg-white text-[#090a0c]" : "text-[#94a3b8] hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-40",
        checked ? "border-white bg-white" : "border-white/15 bg-white/[0.06]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all",
          checked ? "left-[18px] bg-[#090a0c]" : "left-0.5 bg-[#94a3b8]",
        )}
      />
    </button>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none";
export const btn = {
  primary: cn(btnBase, "bg-white px-3.5 py-2 text-[12.5px] text-[#090a0c] hover:bg-white/90"),
  secondary: cn(
    btnBase,
    "border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-[12.5px] text-white hover:bg-white/[0.09]",
  ),
  ghost: cn(
    btnBase,
    "px-2.5 py-1.5 text-[12px] text-[#94a3b8] hover:bg-white/[0.06] hover:text-white",
  ),
  icon: cn(btnBase, "h-8 w-8 text-[#94a3b8] hover:bg-white/[0.08] hover:text-white"),
};

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="no-print flex flex-col gap-3 border-b border-white/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight lg:text-[19px]">{title}</h1>
        {description && (
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-snug text-[#94a3b8]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="print-unclip flex h-full flex-col">
      {header}
      <div className="print-unclip min-h-0 flex-1 overflow-y-auto scroll-thin">{children}</div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function EmptyState({
  icon,
  title,
  body,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  body: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-14 text-center animate-fade-in">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white">
        {icon ?? <CircleDot className="h-5 w-5" />}
      </div>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <div className="mt-1.5 text-[12.5px] leading-relaxed text-[#94a3b8]">{body}</div>
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function OpenMapLink({ label = "Open map" }: { label?: string }) {
  return (
    <Link to="/" className={btn.primary}>
      {label}
    </Link>
  );
}
