import { useState, useEffect, useRef, useCallback } from "react";
import type { HighlightedArea } from "@/types/ingest";
import { CATEGORY_COLORS } from "@/types/ingest";
import { detectAreasProgressive } from "@/services/ingest";

interface IngestPreprocessingProps {
  imageUrl: string;
  filename: string;
  onComplete: (areas: HighlightedArea[]) => void;
}

export function IngestPreprocessing({ imageUrl, filename, onComplete }: IngestPreprocessingProps) {
  const [areas, setAreas] = useState<HighlightedArea[]>([]);
  const [statusText, setStatusText] = useState("INITIALISING SPECTRAL ANALYSIS…");
  const [scanY, setScanY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const animFrameRef = useRef<number>(0);
  const doneRef = useRef(false);

  // Scan-line animation
  useEffect(() => {
    let y = 0;
    const animate = () => {
      if (doneRef.current) return;
      y = (y + 1.5) % (imgDims.height || 400);
      setScanY(y);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [imgDims.height]);

  // Draw bounding boxes on canvas
  const drawBoxes = useCallback((detectedAreas: HighlightedArea[], containerWidth: number, containerHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDims.width) return;

    const scaleX = containerWidth / imgDims.width;
    const scaleY = containerHeight / imgDims.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    for (const area of detectedAreas) {
      const { x, y, width, height } = area.bounding_box;
      const sx = x * scaleX;
      const sy = y * scaleY;
      const sw = width * scaleX;
      const sh = height * scaleY;

      const color = CATEGORY_COLORS[area.category];

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, sy, sw, sh);

      // Corner fill
      ctx.fillStyle = color + "22";
      ctx.fillRect(sx, sy, sw, sh);

      // Numbered badge
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy - 16, 20, 16);
      ctx.fillStyle = "#090A0C";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(area.label.replace("Area ", ""), sx + 10, sy - 4);
    }
  }, [imgDims]);

  // Progressive area detection
  useEffect(() => {
    if (!imgDims.width) return;

    const run = async () => {
      setStatusText("SCANNING — DETECTING AREAS OF INTEREST…");
      const collected: HighlightedArea[] = [];

      const container = canvasRef.current?.parentElement;
      const cw = container?.clientWidth ?? imgDims.width;
      const ch = container?.clientHeight ?? imgDims.height;

      for await (const area of detectAreasProgressive(imageUrl, filename, imgDims)) {
        collected.push(area);
        setAreas([...collected]);
        drawBoxes(collected, cw, ch);
        setStatusText(`SCANNING — ${collected.length} AREA${collected.length !== 1 ? "S" : ""} FOUND`);
      }

      doneRef.current = true;
      setStatusText(`SCAN COMPLETE — ${collected.length} AREAS DETECTED`);

      // Auto-transition after 800ms
      setTimeout(() => onComplete(collected), 800);
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgDims.width]);

  return (
    <div className="flex h-full w-full flex-col bg-[#090A0C]">
      {/* Image canvas area */}
      <div className="relative flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div className="relative w-full h-full max-h-full rounded border border-white/8 overflow-hidden bg-black">
          {/* Satellite image */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Ingested satellite scene"
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgDims({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
            }}
          />

          {/* Scan-line overlay */}
          {!doneRef.current && imgDims.height > 0 && (
            <div
              className="absolute left-0 right-0 h-[2px] pointer-events-none z-10 transition-none"
              style={{
                top: `${(scanY / imgDims.height) * 100}%`,
                background: "linear-gradient(90deg, transparent, #5EEAD4aa, transparent)",
                boxShadow: "0 0 12px 2px #5EEAD455",
              }}
            />
          )}

          {/* Bounding box canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="shrink-0 border-t border-white/8 bg-[#0B0C0E] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Pulsing dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5EEAD4] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5EEAD4]" />
          </span>
          <span className="font-mono text-[10px] font-bold text-[#5EEAD4] tracking-widest uppercase">
            {statusText}
          </span>
        </div>

        {/* Area count badges */}
        <div className="flex gap-2">
          {areas.map((a) => (
            <span
              key={a.area_id}
              className="font-mono text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide"
              style={{ color: CATEGORY_COLORS[a.category], borderColor: CATEGORY_COLORS[a.category] + "44", background: CATEGORY_COLORS[a.category] + "11" }}
            >
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
