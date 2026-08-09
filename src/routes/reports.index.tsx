import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { buildReport } from "@/data/reports";
import { sites } from "@/data/sites";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "GINKGO — REPORTS & EXPORT" },
      { name: "description", content: "Generate and export structured spatial assessment reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const site = useSelectedSite();
  const { selectSite } = useGinkgo();
  const report = buildReport(site.id);

  const handleExport = (format: string) => {
    alert(`Exporting assessment report payload for ${site.name} as ${format}...`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] text-[#F5F5F4] font-mono">
      <PageHeader
        title="SPATIAL ASSESSMENT REPORTS & EXPORT"
        subtitle="COMPLETE CITABLE SPATIAL ASSESSMENT GENERATED FROM TEMPORAL COMPOSITES AND OPEN-SOURCE AI."
        actions={
          <select
            value={site.id}
            onChange={(e) => selectSite(e.target.value)}
            className="rounded border border-white/10 bg-[#16171A] px-3 py-1.5 text-[11px] uppercase text-[#F5F5F4] outline-none"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />

      <div className="p-6 overflow-y-auto">
        <article className="mx-auto flex max-w-4xl flex-col rounded border border-white/10 bg-[#16171A] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] text-[#5EEAD4]">{report.id} · {report.status.toUpperCase()} · {report.generatedAt}</span>
              <h2 className="text-[18px] font-bold text-[#F5F5F4] uppercase">{report.title}</h2>
            </div>
            <div className="flex gap-2">
              {["PDF", "JSON", "GeoJSON"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] uppercase text-[#5EEAD4] hover:bg-[#5EEAD4]/10 transition-all"
                >
                  <Download className="h-3 w-3" />
                  <span>EXPORT {fmt}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border border-white/5 bg-black/30 p-4">
            <span className="text-[10px] font-bold text-[#5EEAD4] block mb-1 uppercase">EXECUTIVE SUMMARY</span>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{report.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.sections.map((s, i) => (
              <div key={i} className="rounded border border-white/5 bg-white/5 p-4 space-y-1">
                <span className="text-[10px] font-bold text-[#5EEAD4] block uppercase">{s.title}</span>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
