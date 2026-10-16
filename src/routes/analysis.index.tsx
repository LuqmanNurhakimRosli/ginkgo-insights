import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, ExternalLink, GitCompare, Map as MapIcon, Plus, Trash2 } from "lucide-react";
import { PRESET_AREAS } from "@/data/presets";
import { formatArea } from "@/lib/geo/math";
import { summarize, useGinkgo } from "@/state/ginkgo-store";
import type { SavedArea } from "@/types/geo";
import {
  btn,
  ClassBadge,
  EmptyState,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
  RiskBadge,
  scoreColor,
  SectionLabel,
} from "@/components/gk/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analysis/")({
  head: () => ({
    meta: [
      { title: "Areas — Ginkgo" },
      {
        name: "description",
        content: "Saved study areas with computed flood, livability and suitability summaries.",
      },
    ],
  }),
  component: AreasPage,
});

type Row = SavedArea & { current?: boolean };

const METRICS: Array<{
  key: keyof SavedArea["summary"];
  label: string;
  fmt: (s: SavedArea["summary"]) => string;
  better: "high" | "low" | null;
}> = [
  {
    key: "floodHighPct",
    label: "High flood cells",
    fmt: (s) => `${s.floodHighPct}%`,
    better: "low",
  },
  { key: "livability", label: "Livability", fmt: (s) => `${s.livability}`, better: "high" },
  { key: "suitability", label: "Suitability", fmt: (s) => `${s.suitability}`, better: "high" },
  { key: "accessScore", label: "Accessibility", fmt: (s) => `${s.accessScore}`, better: "high" },
  { key: "builtUpPct", label: "Built-up", fmt: (s) => `${s.builtUpPct}%`, better: null },
  { key: "greenPct", label: "Green cover", fmt: (s) => `${s.greenPct}%`, better: "high" },
  { key: "areaKm2", label: "Area", fmt: (s) => formatArea(s.areaKm2), better: null },
];

function AreasPage() {
  const {
    savedAreas,
    analysis,
    saveCurrentArea,
    removeSavedArea,
    runAnalysis,
    runPreset,
    hydrated,
  } = useGinkgo();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  const rows: Row[] = useMemo(() => {
    const list: Row[] = savedAreas.map((s) => ({ ...s }));
    if (analysis && !savedAreas.some((s) => s.aoi.id === analysis.aoi.id)) {
      list.unshift({
        id: "current",
        aoi: analysis.aoi,
        savedAt: analysis.computedAt,
        summary: summarize(analysis),
        current: true,
      });
    }
    return list;
  }, [savedAreas, analysis]);

  const compareRows = rows.filter((r) => selected.includes(r.id));
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id],
    );
  const open = (r: Row) => {
    if (!r.current) void runAnalysis({ ...r.aoi, createdAt: Date.now() });
    void navigate({ to: "/" });
  };

  return (
    <Page
      header={
        <PageHeader
          title="Areas"
          description="Every saved area keeps its computed summary. Open an area to recompute it live with the latest data."
          actions={
            <>
              {analysis && !savedAreas.some((s) => s.aoi.id === analysis.aoi.id) && (
                <button onClick={() => saveCurrentArea()} className={btn.secondary}>
                  <Bookmark className="h-3.5 w-3.5" /> Save current
                </button>
              )}
              <Link to="/" className={btn.primary}>
                <Plus className="h-3.5 w-3.5" /> New area
              </Link>
            </>
          }
        />
      }
    >
      <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
        {hydrated && rows.length === 0 ? (
          <Panel>
            <EmptyState
              icon={<Bookmark className="h-5 w-5" />}
              title="No saved areas yet"
              body="Analyse an area on the map and press the bookmark icon to keep it here for comparison."
              actions={
                <Link to="/" className={btn.primary}>
                  Open map
                </Link>
              }
            />
          </Panel>
        ) : (
          <Panel>
            <PanelHeader
              title={`Your areas (${rows.length})`}
              hint="Select up to four areas to compare."
              action={
                selected.length >= 2 ? (
                  <span className="text-[11.5px] text-[#94a3b8]">{selected.length} selected</span>
                ) : undefined
              }
            />
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-[#64748b]">
                  <tr className="border-b border-white/[0.06]">
                    <th className="w-10 px-4 py-2.5" />
                    <th className="px-2 py-2.5 font-semibold">Area</th>
                    <th className="px-2 py-2.5 font-semibold">Riverine flood</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Livability</th>
                    <th className="px-2 py-2.5 font-semibold">Suitability</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Access</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Size</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={cn(
                        "transition-colors hover:bg-white/[0.02]",
                        selected.includes(r.id) && "bg-white/[0.04]",
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(r.id)}
                          onChange={() => toggle(r.id)}
                          aria-label={`Compare ${r.aoi.name}`}
                          className="h-4 w-4 accent-white"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-medium">
                          {r.aoi.name}{" "}
                          {r.current && (
                            <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[#cbd5e1]">
                              current · unsaved
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {r.aoi.locality ?? "—"} ·{" "}
                          {new Date(r.savedAt).toLocaleDateString("en-MY", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <RiskBadge cls={r.summary.floodClass} />
                          <span className="num text-[11px] text-[#94a3b8]">
                            {r.summary.floodHighPct}% High
                          </span>
                        </div>
                      </td>
                      <td
                        className="num px-2 py-3 text-right font-semibold"
                        style={{ color: scoreColor(r.summary.livability) }}
                      >
                        {r.summary.livability}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <span className="num w-6 font-semibold">{r.summary.suitability}</span>
                          <ClassBadge cls={r.summary.suitabilityClass} />
                        </div>
                      </td>
                      <td className="num px-2 py-3 text-right">{r.summary.accessScore}</td>
                      <td className="num px-2 py-3 text-right text-[#94a3b8]">
                        {formatArea(r.summary.areaKm2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {!r.current && (
                            <Link
                              to="/analysis/site/$id"
                              params={{ id: r.id }}
                              className={btn.icon}
                              title="Area profile"
                              aria-label="Area profile"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => open(r)}
                            className={btn.icon}
                            title="Open on map"
                            aria-label="Open on map"
                          >
                            <MapIcon className="h-4 w-4" />
                          </button>
                          {!r.current && (
                            <button
                              onClick={() => removeSavedArea(r.id)}
                              className={cn(btn.icon, "hover:text-[#ef4444]")}
                              title="Delete"
                              aria-label={`Delete ${r.aoi.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="divide-y divide-white/[0.06] md:hidden">
              {rows.map((r) => (
                <div key={r.id} className="space-y-2.5 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`Compare ${r.aoi.name}`}
                      className="mt-1 h-4 w-4 accent-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{r.aoi.name}</div>
                      <div className="truncate text-[11px] text-[#64748b]">
                        {r.current
                          ? "Current · unsaved"
                          : (r.aoi.locality ?? formatArea(r.summary.areaKm2))}
                      </div>
                    </div>
                    <RiskBadge cls={r.summary.floodClass} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Livability", r.summary.livability],
                      ["Suitability", r.summary.suitability],
                      ["Access", r.summary.accessScore],
                    ].map(([k, v]) => (
                      <div key={k as string} className="rounded-lg bg-[#0f1115] py-2">
                        <div
                          className="num text-[15px] font-semibold"
                          style={{ color: scoreColor(v as number) }}
                        >
                          {v}
                        </div>
                        <div className="text-[10px] text-[#64748b]">{k}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => open(r)} className={cn(btn.secondary, "flex-1")}>
                      <MapIcon className="h-3.5 w-3.5" /> Open on map
                    </button>
                    {!r.current && (
                      <>
                        <Link
                          to="/analysis/site/$id"
                          params={{ id: r.id }}
                          className={btn.secondary}
                          aria-label="Area profile"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => removeSavedArea(r.id)}
                          className={btn.secondary}
                          aria-label={`Delete ${r.aoi.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {compareRows.length >= 2 && (
          <Panel className="animate-slide-up">
            <PanelHeader
              title="Comparison"
              icon={<GitCompare className="h-4 w-4" />}
              hint="Best value per row is highlighted. All values are computed, not estimated."
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#64748b]">
                      Metric
                    </th>
                    {compareRows.map((r) => (
                      <th key={r.id} className="px-3 py-2.5 font-semibold">
                        {r.aoi.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  <tr>
                    <td className="px-4 py-2.5 text-[#94a3b8]">Flood class</td>
                    {compareRows.map((r) => (
                      <td key={r.id} className="px-3 py-2.5">
                        <RiskBadge cls={r.summary.floodClass} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-[#94a3b8]">Screening</td>
                    {compareRows.map((r) => (
                      <td key={r.id} className="px-3 py-2.5">
                        <ClassBadge cls={r.summary.suitabilityClass} />
                      </td>
                    ))}
                  </tr>
                  {METRICS.map((m) => {
                    const vals = compareRows.map((r) => r.summary[m.key] as number);
                    const best =
                      m.better === "high"
                        ? Math.max(...vals)
                        : m.better === "low"
                          ? Math.min(...vals)
                          : null;
                    return (
                      <tr key={m.key}>
                        <td className="px-4 py-2.5 text-[#94a3b8]">{m.label}</td>
                        {compareRows.map((r) => (
                          <td
                            key={r.id}
                            className={cn(
                              "num px-3 py-2.5",
                              best != null &&
                                (r.summary[m.key] as number) === best &&
                                "font-semibold text-[#10b981]",
                            )}
                          >
                            {m.fmt(r.summary)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <div>
          <SectionLabel className="mb-2.5">Quick areas</SectionLabel>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {PRESET_AREAS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  runPreset(p.id);
                  void navigate({ to: "/" });
                }}
                className="rounded-xl border border-white/[0.08] bg-[#14161b] p-3.5 text-left transition-colors hover:border-white/25"
              >
                <div className="text-[13px] font-medium">{p.name}</div>
                <div className="text-[11.5px] text-[#64748b]">{p.locality}</div>
                <div className="mt-1.5 text-[11.5px] leading-snug text-[#94a3b8]">{p.purpose}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
