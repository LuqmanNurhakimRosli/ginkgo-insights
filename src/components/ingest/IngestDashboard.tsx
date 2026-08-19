import { useState, useRef, useCallback, useEffect } from "react";
import type { HighlightedArea, IngestionSession } from "@/types/ingest";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types/ingest";
import { ArrowLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface IngestDashboardProps {
  session: IngestionSession;
  onGenerateReport: () => void;
}

function ScoreBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[8px] text-[#4B5563] uppercase tracking-wider w-20 shrink-0">{label}</span>
      <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", colorClass)} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-[#F5F5F4] w-6 text-right">{value}</span>
    </div>
  );
}

export function IngestDashboard({ session, onGenerateReport }: IngestDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });

  const selectedArea = selectedId ? session.areas.find((a) => a.area_id === selectedId) ?? null : null;

  const drawBoxes = useCallback((focusId: string | null, cw: number, ch: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDims.width) return;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);

    const scaleX = cw / imgDims.width;
    const scaleY = ch / imgDims.height;

    for (const area of session.areas) {
      const { x, y, width, height } = area.bounding_box;
      const sx = x * scaleX;
      const sy = y * scaleY;
      const sw = width * scaleX;
      const sh = height * scaleY;
      const color = CATEGORY_COLORS[area.category];
      const isFocused = area.area_id === focusId;
      const alpha = focusId ? (isFocused ? 1 : 0.3) : 1;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = isFocused ? "#5EEAD4" : color;
      ctx.lineWidth = isFocused ? 2 : 1.5;
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.fillStyle = (isFocused ? "#5EEAD4" : color) + "18";
      ctx.fillRect(sx, sy, sw, sh);

      // Badge
      ctx.globalAlpha = alpha;
      ctx.fillStyle = isFocused ? "#5EEAD4" : color;
      ctx.fillRect(sx, sy - 16, 20, 16);
      ctx.fillStyle = "#090A0C";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(area.label.replace("Area ", ""), sx + 10, sy - 4);
    }
    ctx.globalAlpha = 1;
  }, [imgDims, session.areas]);

  // Redraw on selection change or img dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDims.width) return;
    const cw = canvas.parentElement?.clientWidth ?? imgDims.width;
    const ch = canvas.parentElement?.clientHeight ?? imgDims.height;
    drawBoxes(selectedId, cw, ch);
  }, [selectedId, imgDims, drawBoxes]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDims.width) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvas.width / imgDims.width;
    const scaleY = canvas.height / imgDims.height;

    for (const area of session.areas) {
      const sx = area.bounding_box.x * scaleX;
      const sy = area.bounding_box.y * scaleY;
      const sw = area.bounding_box.width * scaleX;
      const sh = area.bounding_box.height * scaleY;
      if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
        setSelectedId((prev) => (prev === area.area_id ? null : area.area_id));
        return;
      }
    }
    setSelectedId(null);
  };

  return (
    <div className="flex h-full w-full bg-[#090A0C] overflow-hidden">
      {/* LEFT: Image canvas */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Canvas */}
        <div className="relative flex-1 p-4 overflow-hidden">
          <div className="relative w-full h-full rounded border border-white/8 overflow-hidden bg-black">
            <img
              ref={imgRef}
              src={session.source_image_url}
              alt="Satellite scene"
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={(e) => {
                const img = e.currentTarget;
                const w = img.naturalWidth || img.width || 800;
                const h = img.naturalHeight || img.height || 600;
                setImgDims({ width: w, height: h });
              }}
            />
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="absolute inset-0 w-full h-full cursor-crosshair z-10"
            />
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="shrink-0 flex gap-2 px-4 pb-3 overflow-x-auto">
          {session.areas.map((area) => (
            <button
              key={area.area_id}
              onClick={() => setSelectedId((prev) => (prev === area.area_id ? null : area.area_id))}
              className={cn(
                "shrink-0 flex flex-col items-start gap-0.5 rounded border px-2.5 py-2 transition-all",
                selectedId === area.area_id
                  ? "border-[#5EEAD4]/50 bg-[#5EEAD4]/8"
                  : "border-white/8 bg-[#14161B] hover:border-white/20"
              )}
            >
              <span
                className="font-mono text-[8px] font-bold uppercase"
                style={{ color: CATEGORY_COLORS[area.category] }}
              >
                {area.label}
              </span>
              <span className="font-mono text-[7px] text-[#4B5563] uppercase tracking-wide">
                {area.category.replace(/_/g, " ")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Sidebar */}
      <div className="w-[300px] shrink-0 flex flex-col border-l border-white/8 bg-[#0B0C0E] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedArea ? (
            /* Area detail view */
            <>
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5 font-mono text-[9px] text-[#4B5563] hover:text-[#9CA3AF] uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Overview
              </button>

              <div className="space-y-1">
                <span
                  className="font-mono text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: CATEGORY_COLORS[selectedArea.category] }}
                >
                  {CATEGORY_LABELS[selectedArea.category]}
                </span>
                <h3 className="font-mono text-[14px] font-bold text-[#F5F5F4] uppercase">{selectedArea.label}</h3>
              </div>

              <div className="rounded border border-white/5 bg-white/3 p-3 space-y-2">
                <ScoreBar label="Suitability" value={selectedArea.suitability_score} colorClass="bg-[#10B981]" />
                <ScoreBar label="Livability" value={selectedArea.livability_index} colorClass="bg-[#38BDF8]" />
                <ScoreBar label="Flood Risk" value={selectedArea.flood_risk_score} colorClass="bg-[#EF4444]" />
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[8px] text-[#4B5563] uppercase tracking-widest block">AI Assessment</span>
                <p className="font-mono text-[10px] text-[#9CA3AF] leading-relaxed">{selectedArea.explanation}</p>
              </div>

              <div className="rounded border border-white/5 bg-[#14161B] p-3 space-y-1">
                <span className="font-mono text-[8px] text-[#5EEAD4] uppercase tracking-widest block">Suggested Action</span>
                <p className="font-mono text-[10px] text-[#D1D5DB] leading-relaxed">{selectedArea.suggested_action}</p>
              </div>
            </>
          ) : (
            /* Whole-image overview */
            <>
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-[#4B5563] uppercase tracking-widest block">Scene Overview</span>
                <h3 className="font-mono text-[14px] font-bold text-[#F5F5F4] uppercase">
                  {session.overview.total_areas} Area{session.overview.total_areas !== 1 ? "s" : ""} Detected
                </h3>
              </div>

              {/* Category breakdown */}
              <div className="space-y-1.5">
                {Object.entries(session.overview.category_breakdown).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span
                      className="font-mono text-[9px] uppercase font-bold"
                      style={{ color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] }}
                    >
                      {cat.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-[#F5F5F4]">{count}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/8" />

              <div className="space-y-1.5">
                <span className="font-mono text-[8px] text-[#4B5563] uppercase tracking-widest block">AI Overview</span>
                <p className="font-mono text-[10px] text-[#9CA3AF] leading-relaxed">{session.overview.summary}</p>
              </div>

              <div className="rounded border border-white/5 bg-[#14161B] p-2.5">
                <span className="font-mono text-[8px] text-[#4B5563] block">
                  Click any highlighted area or card below to inspect its detailed assessment.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Persistent generate report button */}
        <div className="shrink-0 border-t border-white/8 p-3">
          <button
            onClick={onGenerateReport}
            className="w-full flex items-center justify-center gap-2 rounded border border-[#5EEAD4]/30 bg-[#5EEAD4]/8 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#5EEAD4] hover:bg-[#5EEAD4]/15 transition-all"
          >
            <FileText className="h-3.5 w-3.5" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
