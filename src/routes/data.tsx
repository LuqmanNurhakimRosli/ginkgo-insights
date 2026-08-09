import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { datasets, models, buildReport } from "@/data/reports";
import { sites } from "@/data/sites";
import { Database, Download, FileText, Filter, HardDrive, Layers, Server } from "lucide-react";
import type { Report } from "@/types";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "GINKGO — DATA TERMINAL" },
      { name: "description", content: "Dense Palantir-style spatial data & report terminal." },
    ],
  }),
  component: DataTerminalView,
});

type FilterCategory = "ALL" | "RASTER" | "VECTOR" | "GEOJSON" | "REPORTS" | "MODELS";

export function DataTerminalView() {
  const [filter, setFilter] = useState<FilterCategory>("ALL");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const formattedDatasets = datasets.map((d) => ({
    ...d,
    systemId: `DS-${d.id.toUpperCase()}-${d.type.slice(0, 3).toUpperCase()}`,
  }));

  const filteredData = formattedDatasets.filter((d) => {
    if (filter === "ALL") return true;
    if (filter === "RASTER") return d.type === "Raster";
    if (filter === "VECTOR") return d.type === "Vector";
    if (filter === "GEOJSON") return d.type === "GeoJSON";
    return true;
  });

  const getStatusColor = (status: string) => {
    if (status === "Processed" || status === "Complete") return "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]";
    if (status === "Generated") return "border-[#5EEAD4]/30 bg-[#5EEAD4]/10 text-[#5EEAD4]";
    if (status === "Queued" || status === "Prototype") return "border-[#EAB308]/30 bg-[#EAB308]/10 text-[#EAB308]";
    return "border-white/10 bg-white/5 text-[#9CA3AF]";
  };

  const openReportForSite = (siteId: string) => {
    const rpt = buildReport(siteId);
    setSelectedReport(rpt);
  };

  const handleExport = (format: "PDF" | "JSON" | "GeoJSON") => {
    alert(`Exporting dataset / report payload as ${format}...`);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0B0C0E]">
      {/* Top Action Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4 font-mono text-[11px] uppercase tracking-widest text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-[#5EEAD4]" />
          <span className="font-bold text-[#F5F5F4]">VIEW 4 // SYSTEM DATA TERMINAL</span>
        </div>

        {/* Ghost Button Export Toolbar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5B5F66]">EXPORT TARGET:</span>
          {(["PDF", "JSON", "GeoJSON"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="flex items-center gap-1 rounded border border-white/10 bg-[#16171A] px-2.5 py-1 text-[10px] text-[#F5F5F4] transition-all hover:border-[#5EEAD4]/50 hover:bg-[#5EEAD4]/10 hover:text-[#5EEAD4]"
            >
              <Download className="h-3 w-3" />
              <span>{fmt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Terminal Composition */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sub-Rail: Category Filter List */}
        <div className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-[#16171A] p-3">
          <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
            DATASET CATEGORIES
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {[
              { id: "ALL", label: "ALL DATASETS", count: datasets.length, icon: HardDrive },
              { id: "RASTER", label: "RASTER COMPOSITES", count: datasets.filter((d) => d.type === "Raster").length, icon: Layers },
              { id: "VECTOR", label: "VECTOR NETWORKS", count: datasets.filter((d) => d.type === "Vector").length, icon: Filter },
              { id: "GEOJSON", label: "CLASSIFICATIONS", count: datasets.filter((d) => d.type === "GeoJSON").length, icon: Database },
              { id: "REPORTS", label: "ASSESSMENT REPORTS", count: sites.length, icon: FileText },
              { id: "MODELS", label: "MODEL ADAPTERS", count: models.length, icon: Server },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = filter === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFilter(cat.id as FilterCategory);
                    setSelectedReport(null);
                  }}
                  className={`flex w-full items-center justify-between rounded p-2 text-left transition-all ${
                    isActive
                      ? "border border-[#5EEAD4]/30 bg-[#5EEAD4]/10 text-[#5EEAD4]"
                      : "text-[#9CA3AF] hover:bg-white/5 hover:text-[#F5F5F4]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cat.label}</span>
                  </div>
                  <span className="text-[9px] num">{cat.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center/Main Table & Report Reader Area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0B0C0E]">
          {/* Detailed Report View (if opened) */}
          {selectedReport ? (
            <div className="flex h-full w-full flex-col overflow-hidden p-4 font-mono">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] text-[#5EEAD4]">REPORT IDENTIFIER: {selectedReport.id}</span>
                  <h2 className="text-[16px] font-bold text-[#F5F5F4]">{selectedReport.title}</h2>
                  <p className="text-[10px] text-[#9CA3AF]">STATUS: {selectedReport.status.toUpperCase()} · DATE: {selectedReport.generatedAt}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="rounded border border-white/10 bg-[#16171A] px-3 py-1 text-[11px] text-[#F5F5F4] hover:bg-white/10"
                >
                  BACK TO TABLE
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 text-[12px] text-[#F5F5F4]">
                <div className="rounded border border-white/10 bg-[#16171A] p-4">
                  <div className="text-[10px] text-[#5EEAD4] uppercase mb-1">EXECUTIVE SUMMARY</div>
                  <p className="leading-relaxed text-[#9CA3AF]">{selectedReport.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedReport.sections.map((sec, i) => (
                    <div key={i} className="rounded border border-white/10 bg-[#16171A] p-3">
                      <div className="text-[10px] font-bold uppercase text-[#5EEAD4] mb-1">{sec.title}</div>
                      <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{sec.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : filter === "REPORTS" ? (
            /* Reports Selection List */
            <div className="p-4 font-mono">
              <div className="mb-3 text-[11px] uppercase tracking-widest text-[#9CA3AF]">
                GENERATED ASSESSMENT REPORTS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sites.map((s) => (
                  <div key={s.id} className="rounded border border-white/10 bg-[#16171A] p-4">
                    <div className="text-[10px] text-[#5EEAD4]">RPT-{s.id.toUpperCase()}</div>
                    <div className="text-[14px] font-bold text-[#F5F5F4] uppercase">{s.name} ASSESSMENT</div>
                    <div className="mt-1 text-[10px] text-[#9CA3AF]">{s.locality} · {s.areaHa} HA</div>
                    <button
                      onClick={() => openReportForSite(s.id)}
                      className="mt-3 w-full rounded border border-[#5EEAD4]/30 bg-[#5EEAD4]/10 py-1.5 text-[10px] font-semibold text-[#5EEAD4] hover:bg-[#5EEAD4]/20"
                    >
                      OPEN REPORT TERMINAL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : filter === "MODELS" ? (
            /* Model Adapters View */
            <div className="p-4 font-mono">
              <div className="mb-3 text-[11px] uppercase tracking-widest text-[#9CA3AF]">
                CONNECTED AI & SPATIAL MODEL ADAPTERS
              </div>
              <div className="grid grid-cols-1 gap-3">
                {models.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded border border-white/10 bg-[#16171A] p-4">
                    <div>
                      <span className="text-[10px] text-[#5EEAD4]">{m.id.toUpperCase()}</span>
                      <h3 className="text-[14px] font-bold text-[#F5F5F4]">{m.name}</h3>
                      <p className="text-[10px] text-[#9CA3AF]">OWNER: {m.owner} · {m.note}</p>
                    </div>
                    <span className={`rounded border px-2.5 py-1 text-[10px] uppercase font-semibold ${getStatusColor(m.status)}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Dense Data Table (Fixed Header, Internal Scroll Body) */
            <div className="flex h-full flex-col overflow-hidden font-mono">
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#16171A] text-[#9CA3AF] uppercase">
                    <tr>
                      <th className="px-4 py-2.5">SYSTEM ID</th>
                      <th className="px-4 py-2.5">DATASET NAME</th>
                      <th className="px-4 py-2.5">TYPE</th>
                      <th className="px-4 py-2.5">LOCATION</th>
                      <th className="px-4 py-2.5">PERIOD</th>
                      <th className="px-4 py-2.5">UPDATED</th>
                      <th className="px-4 py-2.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#F5F5F4]">
                    {filteredData.map((d) => (
                      <tr key={d.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 text-[#5EEAD4] font-semibold">{d.systemId}</td>
                        <td className="px-4 py-2.5 font-medium">{d.name}</td>
                        <td className="px-4 py-2.5 text-[#9CA3AF]">{d.type}</td>
                        <td className="px-4 py-2.5 text-[#9CA3AF]">{d.location}</td>
                        <td className="px-4 py-2.5 text-[#9CA3AF] num">{d.period}</td>
                        <td className="px-4 py-2.5 text-[#9CA3AF] num">{d.updated}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block rounded border px-2 py-0.5 text-[9px] uppercase font-semibold ${getStatusColor(d.status)}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
