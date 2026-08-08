import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Droplets,
  Leaf,
  Route as RouteIcon,
  Satellite,
  ShieldCheck,
  Sparkles,
  TreePine,
  Users,
} from "lucide-react";
import { AICopilot } from "@/components/ai/AICopilot";
import { GinkgoWordmark } from "@/components/brand/GinkgoLogo";
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

const features = [
  { icon: Satellite, title: "Satellite & AI", body: "Temporal analysis & change detection" },
  { icon: TreePine, title: "Sustainable", body: "Protects the environment for the future" },
  { icon: Sparkles, title: "Smart", body: "Fast decisions via the AI Copilot" },
  { icon: Users, title: "Inclusive", body: "Fair, balanced planning outcomes" },
];

const pages = [
  { to: "/", label: "1. Dashboard", desc: "Area summary, key indicators and analysis status." },
  { to: "/analysis", label: "2. Map & Analysis", desc: "Interactive map, layers and area details." },
  { to: "/change-detection", label: "3. Change Detection", desc: "T1 vs T2 change, visual and statistical." },
  { to: "/livability", label: "4. Livability Index", desc: "Five-dimension livability breakdown." },
  { to: "/planning", label: "5. Suitability Analysis", desc: "Land suitability screening for development." },
  { to: "/ai-copilot", label: "6. AI Copilot", desc: "Ask spatial questions, get justified answers." },
  { to: "/reports", label: "7. Reports & Export", desc: "Full assessment, PDF / JSON / GeoJSON." },
  { to: "/data", label: "8. Data", desc: "All data sources and metadata used." },
  { to: "/settings", label: "9. Settings", desc: "Provider, weights, models and feature flags." },
  { to: "/help", label: "10. Help", desc: "Methodology, limitations and FAQ." },
] as const;

const kpiIcons = [Building2, Leaf, Droplets, TreePine, RouteIcon, ShieldCheck];

function Dashboard() {
  const site = useSelectedSite();
  const { analysisRun, runAnalysis } = useGinkgo();
  const kpis = getKpiStrip(site.id);

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        {/* Intro panel */}
        <aside className="hidden xl:block">
          <div className="ginkgo-panel px-4 py-4">
            <GinkgoWordmark />
            <h2 className="mt-5 text-[22px] font-semibold leading-tight tracking-tight">
              Designing Sustainable Cities with Spatial Intelligence and AI
            </h2>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              Ginkgo helps planners make data-driven decisions using satellite analysis and spatial
              intelligence, with planning guidance that is transparent and accountable.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title}>
                  <f.icon className="h-4.5 w-4.5 text-primary" />
                  <div className="mt-1.5 text-[12.5px] font-semibold">{f.title}</div>
                  <div className="text-[11px] leading-snug text-muted-foreground">{f.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ginkgo-panel mt-4 px-4 py-3.5">
            <div className="label-caps">Pipeline</div>
            <ol className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
              {[
                "Satellite data",
                "Geospatial AI",
                "Spatial analysis",
                "Livability intelligence",
                "AI planning copilot",
                "Recommendation & report",
              ].map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="num text-primary">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Map workspace */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[18px] font-semibold tracking-tight">
                {site.name} · {site.locality}
              </h1>
              <p className="text-[12px] text-muted-foreground">
                Map-first workspace · prototype imagery and dummy analysis outputs
              </p>
            </div>
            <button
              onClick={runAnalysis}
              className="rounded-md bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {analysisRun ? "Re-run Spatial Intelligence" : "Run Spatial Intelligence"}
            </button>
          </div>

          <MapWorkspace height="h-[540px]" />

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
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
        </section>

        {/* Copilot */}
        <aside>
          <AICopilot className="h-[700px]" />
        </aside>
      </div>

      {/* Page gallery */}
      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">All Pages</h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Ginkgo consists of ten pages that form the complete planning workflow.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {pages.map((p) => (
            <Link
              key={p.label}
              to={p.to}
              className="ginkgo-panel px-3.5 py-3 transition-shadow hover:shadow-[var(--shadow-float)]"
            >
              <div className="mb-2 h-16 rounded-md border border-border bg-surface" />
              <div className="text-[12.5px] font-semibold">{p.label}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{p.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
