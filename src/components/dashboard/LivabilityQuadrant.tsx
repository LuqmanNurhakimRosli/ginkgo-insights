import { ShieldCheck, Trees, Compass, Activity } from "lucide-react";

interface LivabilityQuadrantProps {
  score?: number;
  statusLabel?: string;
  statusColor?: string;
  environmentScore?: number;
  accessibilityScore?: number;
  resilienceScore?: number;
  sustainabilityScore?: number;
  onOpenBreakdown?: () => void;
}

export function LivabilityQuadrant({
  score = 70,
  statusLabel = "Moderate / Balanced Growth",
  statusColor = "#f59e0b",
  environmentScore = 66,
  accessibilityScore = 75,
  resilienceScore = 59,
  sustainabilityScore = 85,
  onOpenBreakdown,
}: LivabilityQuadrantProps) {
  return (
    <div className="surface-panel rounded-2xl p-5 space-y-4 shadow-2xl border border-white/8">
      {/* Header & Status Pill */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm tracking-wide">
            Urban & Regional Livability Index
          </h3>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">
            Composite Sustainability & Growth Rating
          </p>
        </div>

        <div
          className="rounded-xl px-2.5 py-1 text-[11px] font-medium border text-right"
          style={{
            borderColor: `${statusColor}40`,
            backgroundColor: `${statusColor}12`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Main Score Hero Display */}
      <div className="surface-panel rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden bg-[#101217]">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-white num tracking-tight">
            {score}
          </span>
          <span className="text-sm font-medium text-[#64748b]">/ 100</span>
        </div>

        {/* Linear Progress Indicator Bar */}
        <div className="w-full max-w-[280px] h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${score}%`,
              backgroundColor: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444",
            }}
          />
        </div>
      </div>

      {/* 4-Quadrant Indicator Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Quadrant 1: Environment */}
        <div className="surface-panel rounded-xl p-3 space-y-1.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-white font-medium">
              <Trees className="h-3.5 w-3.5 text-[#10b981]" />
              <span>Environment</span>
            </div>
            <span className="text-xs font-semibold text-white num">{environmentScore}/100</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#10b981]" style={{ width: `${environmentScore}%` }} />
          </div>
          <p className="text-[10px] text-[#94a3b8]">Canopy & NDVI coverage</p>
        </div>

        {/* Quadrant 2: Accessibility */}
        <div className="surface-panel rounded-xl p-3 space-y-1.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-white font-medium">
              <Compass className="h-3.5 w-3.5 text-[#38bdf8]" />
              <span>Accessibility</span>
            </div>
            <span className="text-xs font-semibold text-white num">{accessibilityScore}/100</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#38bdf8]" style={{ width: `${accessibilityScore}%` }} />
          </div>
          <p className="text-[10px] text-[#94a3b8]">Transit & arterial network</p>
        </div>

        {/* Quadrant 3: Disaster Resilience */}
        <div className="surface-panel rounded-xl p-3 space-y-1.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-white font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span>Resilience</span>
            </div>
            <span className="text-xs font-semibold text-white num">{resilienceScore}/100</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#f59e0b]" style={{ width: `${resilienceScore}%` }} />
          </div>
          <p className="text-[10px] text-[#94a3b8]">Flood buffer & runoff</p>
        </div>

        {/* Quadrant 4: Sustainability */}
        <div className="surface-panel rounded-xl p-3 space-y-1.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-white font-medium">
              <Activity className="h-3.5 w-3.5 text-white" />
              <span>Sustainability</span>
            </div>
            <span className="text-xs font-semibold text-white num">{sustainabilityScore}/100</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${sustainabilityScore}%` }} />
          </div>
          <p className="text-[10px] text-[#94a3b8]">Statutory land compatibility</p>
        </div>
      </div>
    </div>
  );
}
