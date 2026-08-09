import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Database,
  Droplets,
  FileText,
  Leaf,
  LifeBuoy,
  Map as MapIcon,
  Route as RouteIcon,
  Settings2,
  ShieldCheck,
  Sparkles,
  Timer,
  TreePine,
} from "lucide-react";
import { AICopilot } from "@/components/ai/AICopilot";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { MetricCard } from "@/components/metrics/MetricCard";
import { getKpiStrip } from "@/data/analysis";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ginkgo Dashboard — Spatial Planning Command Center" },
      {
        name: "description",
        content:
          "Live satellite change detection, livability scoring and an AI planning copilot in one map-first workspace.",
      },
      { property: "og:title", content: "Ginkgo Dashboard — Spatial Planning Command Center" },
      {
        property: "og:description",
        content:
          "Live satellite change detection, livability scoring and an AI planning copilot in one map-first workspace.",
      },
    ],
  }),
  component: Dashboard,
});

const pages = [
  { to: "/analysis", icon: MapIcon, label: "Map & Analysis", desc: "Interactive map, layers and parcel details." },
  { to: "/change-detection", icon: Timer, label: "Change Detection", desc: "T1 vs T2 change, visual and statistical." },
  { to: "/livability", icon: Leaf, label: "Livability Index", desc: "Five-dimension livability breakdown." },
  { to: "/planning", icon: ShieldCheck, label: "Suitability Analysis", desc: "Land screening for development." },
  { to: "/ai-copilot", icon: Sparkles, label: "AI Copilot", desc: "Ask spatial questions, get justified answers." },
  { to: "/reports", icon: FileText, label: "Reports & Export", desc: "Assessment as PDF, JSON or GeoJSON." },
  { to: "/data", icon: Database, label: "Data Sources", desc: "Provenance, resolution and refresh cadence." },
  { to: "/settings", icon: Settings2, label: "Settings", desc: "Provider, weights, models, feature flags." },
  { to: "/help", icon: LifeBuoy, label: "Help & Methodology", desc: "Method, limitations and FAQ." },
] as const;

const kpiIcons = [Building2, Leaf, Droplets, TreePine, RouteIcon, ShieldCheck];

function Dashboard() {
  const site = useSelectedSite();
  const { analysisRun, runAnalysis } = useGinkgo();
  const kpis = getKpiStrip(site.id);

  return (
    <div>
      {/* Slim welcome strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
            {site.name} <span className="text-muted-foreground">· {site.locality}</span>
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Spatial intelligence command center · prototype imagery and indicative analysis outputs.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[12px] text-muted-foreground md:inline">
            {analysisRun ? "Analysis current" : "Analysis not yet run"}
          </span>
          <button
            onClick={runAnalysis}
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {analysisRun ? "Re-run Spatial Intelligence" : "Run Spatial Intelligence"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <MapWorkspace height="h-[600px]" />

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((m, i) => {
              const Icon = kpiIcons[i]!;
              return (
                <MetricCard
                  key={m.id}
                  metric={m}
                  icon={<Icon className="h-3.5 w-3.5 text-primary" />}
                />
              );
            })}
          </div>

          {/* Compact workflow index */}
          <div className="ginkgo-panel mt-4 px-4 py-4">
            <h2 className="text-[16px] font-semibold">Planning workflow</h2>
            <div className="mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
              {pages.map((p) => (
                <Link
                  key={p.to}
                  to={p.to}
                  className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-secondary"
                >
                  <p.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{p.label}</span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {p.desc}
                    </span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <aside>
          <AICopilot className="h-[calc(100vh-152px)] xl:sticky xl:top-[72px]" />
        </aside>
      </div>
    </div>
  );
}
