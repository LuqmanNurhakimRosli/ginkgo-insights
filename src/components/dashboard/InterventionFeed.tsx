import { AlertTriangle, ChevronRight, MapPin, CheckCircle2 } from "lucide-react";

export interface HotspotIncident {
  id: string;
  title: string;
  location: string;
  severity: "critical" | "warning" | "optimal";
  timestamp: string;
  metric: string;
  description: string;
  actionLabel: string;
}

interface InterventionFeedProps {
  onActionClick?: (hotspot: HotspotIncident) => void;
}

const defaultHotspots: HotspotIncident[] = [
  {
    id: "hotspot-1",
    title: "Floodplain Inundation Surge",
    location: "Sungai Buah Basin (Hydrological Risk Sector)",
    severity: "critical",
    timestamp: "Jan 2025 Observation",
    metric: "+18.4% Runoff Hazard",
    description: "Hydrological hazard zone breached; on-site stormwater retention capacity mandatory before statutory endorsement.",
    actionLabel: "Review Sector",
  },
  {
    id: "hotspot-2",
    title: "Canopy & NDVI Depletion",
    location: "Putrajaya East Corridor (Sector 14)",
    severity: "warning",
    timestamp: "Jan 2025 Observation",
    metric: "-12.3% Green Canopy",
    description: "Built-up expansion detected along transit spine; triggers compensatory green space offset requirement.",
    actionLabel: "View Offset Rule",
  },
  {
    id: "hotspot-3",
    title: "High Suitability Development Parcel",
    location: "Putrajaya Central District (Sector 11)",
    severity: "optimal",
    timestamp: "Jan 2025 Observation",
    metric: "84/100 Livability Score",
    description: "Optimal arterial accessibility (91/100) and low flood exposure; ready for residential/mixed layout endorsement.",
    actionLabel: "Generate Report",
  },
];

export function InterventionFeed({ onActionClick }: InterventionFeedProps) {
  return (
    <div className="surface-panel rounded-2xl p-5 space-y-4 shadow-2xl border border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold text-sm tracking-wide">
          <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
          <span>Priority Intervention Hotspots</span>
        </div>
        <span className="text-[10px] bg-white/5 text-[#94a3b8] px-2 py-0.5 rounded font-mono">
          3 DETECTED
        </span>
      </div>

      {/* Incident List */}
      <div className="space-y-2.5">
        {defaultHotspots.map((item) => {
          const isCrit = item.severity === "critical";
          const isWarn = item.severity === "warning";

          const badgeBorder = isCrit
            ? "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
            : isWarn
            ? "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]"
            : "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]";

          return (
            <div
              key={item.id}
              className="surface-panel rounded-xl p-3.5 space-y-2 border border-white/5 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{item.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${badgeBorder}`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#94a3b8] mt-0.5">
                    <MapPin className="h-2.5 w-2.5 text-[#64748b]" />
                    <span>{item.location}</span>
                  </div>
                </div>

                <span className="text-xs font-semibold num text-white">{item.metric}</span>
              </div>

              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-[9px] text-[#64748b] font-mono">{item.timestamp}</span>
                <button
                  onClick={() => onActionClick?.(item)}
                  className="flex items-center gap-1 text-[10px] font-medium text-white hover:text-[#38bdf8] transition-colors"
                >
                  <span>{item.actionLabel}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
