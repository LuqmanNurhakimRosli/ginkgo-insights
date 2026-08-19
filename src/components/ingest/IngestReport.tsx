import type { IngestionSession } from "@/types/ingest";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types/ingest";
import { Download, ArrowLeft } from "lucide-react";
import { downloadIngestReport } from "@/services/ingest";

interface IngestReportProps {
  session: IngestionSession;
  onBack: () => void;
}

export function IngestReport({ session, onBack }: IngestReportProps) {
  const docId = `GNK-ING-${session.source_image_id.slice(-8).toUpperCase()}`;
  const dateStr = new Date(session.ingested_at).toLocaleDateString("en-MY", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="flex h-full w-full flex-col bg-[#090A0C] overflow-hidden">
      {/* Fixed header */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/8 px-6 py-3 bg-[#0B0C0E]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-[9px] text-[#4B5563] hover:text-[#9CA3AF] uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </button>

        {/* Export buttons */}
        <div className="flex gap-2">
          {(["pdf", "json", "geojson"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => downloadIngestReport(session, fmt)}
              className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#5EEAD4] hover:bg-[#5EEAD4]/10 transition-all"
            >
              <Download className="h-3 w-3" />
              {fmt === "pdf" ? "📥 PDF Report" : fmt === "json" ? "📥 JSON" : "📥 GeoJSON"}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable report preview */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <article className="mx-auto max-w-3xl space-y-6">
          {/* Cover section */}
          <div className="rounded border border-white/8 bg-[#14161B] p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="font-mono text-[9px] text-[#5EEAD4] uppercase tracking-widest block">
                  {docId} · VERIFIED · {dateStr}
                </span>
                <h1 className="font-mono text-[18px] font-bold text-[#F5F5F4] uppercase leading-tight">
                  Spatial Planning Assessment Report
                </h1>
                <p className="font-mono text-[10px] text-[#4B5563]">
                  Source: {session.source_filename} · {session.overview.total_areas} areas detected
                </p>
              </div>
            </div>

            {/* Source image thumbnail */}
            <div className="h-32 w-full rounded border border-white/5 overflow-hidden bg-black">
              <img src={session.source_image_url} alt="Source scene" className="w-full h-full object-cover opacity-80" />
            </div>

            {/* Category breakdown table */}
            <div className="space-y-1.5">
              <span className="font-mono text-[8px] text-[#4B5563] uppercase tracking-widest block">Category Breakdown</span>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="font-mono text-[8px] text-[#4B5563] uppercase pb-1.5 pr-4">Category</th>
                    <th className="font-mono text-[8px] text-[#4B5563] uppercase pb-1.5 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(session.overview.category_breakdown).map(([cat, count]) => (
                    <tr key={cat} className="border-b border-white/5">
                      <td className="py-1.5 pr-4">
                        <span
                          className="font-mono text-[9px] font-bold uppercase"
                          style={{ color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] }}
                        >
                          {cat.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-1.5 font-mono text-[10px] tabular-nums text-[#F5F5F4] text-right">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Overview summary */}
            <div className="rounded border border-white/5 bg-black/30 p-3">
              <span className="font-mono text-[8px] text-[#5EEAD4] uppercase tracking-widest block mb-1">Executive Summary</span>
              <p className="font-mono text-[10px] text-[#9CA3AF] leading-relaxed">{session.overview.summary}</p>
            </div>
          </div>

          {/* Per-area sections */}
          {session.areas.map((area) => (
            <div key={area.area_id} className="rounded border border-white/8 bg-[#14161B] p-5 space-y-4">
              {/* Area header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="space-y-0.5">
                  <span
                    className="font-mono text-[8px] font-bold uppercase tracking-widest block"
                    style={{ color: CATEGORY_COLORS[area.category] }}
                  >
                    {CATEGORY_LABELS[area.category]}
                  </span>
                  <h2 className="font-mono text-[14px] font-bold text-[#F5F5F4] uppercase">{area.label}</h2>
                </div>
              </div>

              {/* Score table */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Suitability Score", value: area.suitability_score, color: "#10B981" },
                  { label: "Livability Index", value: area.livability_index, color: "#38BDF8" },
                  { label: "Flood Risk Score", value: area.flood_risk_score, color: "#EF4444" },
                ].map((metric) => (
                  <div key={metric.label} className="rounded border border-white/5 bg-white/3 p-2.5 text-center space-y-0.5">
                    <span className="font-mono text-[20px] font-bold tabular-nums" style={{ color: metric.color }}>
                      {metric.value}
                    </span>
                    <span className="font-mono text-[7px] text-[#4B5563] uppercase tracking-wider block">{metric.label}</span>
                  </div>
                ))}
              </div>

              {/* AI explanation */}
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-[#4B5563] uppercase tracking-widest block">AI Spatial Assessment</span>
                <p className="font-mono text-[10px] text-[#9CA3AF] leading-relaxed">{area.explanation}</p>
              </div>

              {/* Suggested action */}
              <div className="rounded border border-[#5EEAD4]/15 bg-[#5EEAD4]/5 p-3 space-y-1">
                <span className="font-mono text-[8px] text-[#5EEAD4] uppercase tracking-widest block">Suggested Planning Action</span>
                <p className="font-mono text-[10px] text-[#D1D5DB] leading-relaxed">{area.suggested_action}</p>
              </div>
            </div>
          ))}

          {/* Disclaimer */}
          <div className="rounded border border-white/5 bg-[#14161B] p-4">
            <span className="font-mono text-[8px] text-[#4B5563] uppercase tracking-widest block mb-1.5">Disclaimer</span>
            <p className="font-mono text-[9px] text-[#4B5563] leading-relaxed">
              This is a decision-support prototype. AI-generated insights and spatial suitability results should be reviewed by qualified planning professionals and should not be interpreted as statutory planning approval under Akta 172 (Town & Country Planning Act 1976) or any other Malaysian planning legislation.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
