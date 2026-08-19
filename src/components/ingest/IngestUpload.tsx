import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Satellite } from "lucide-react";
import { cn } from "@/lib/utils";

// Benchmark sample images reusing existing backend/samples pattern
const SAMPLE_IMAGES = [
  {
    id: "putra_heights",
    title: "Putra Heights Corridor",
    locality: "Klang River Basin, Selangor",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8044/12812",
  },
  {
    id: "sungai_buah",
    title: "Sungai Buah Floodplain",
    locality: "Hulu Langat, Selangor",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8038/12828",
  },
  {
    id: "alpine_valley",
    title: "Forest Reserve Corridor",
    locality: "Pahang Highland Buffer",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8036/12832",
  },
];

interface IngestUploadProps {
  onImageReady: (imageUrl: string, filename: string) => void;
}

export function IngestUpload({ onImageReady }: IngestUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setSelectedFile({ name: file.name, size: formatBytes(file.size), url });
    };
    reader.readAsDataURL(file);
  };

  const handleSample = (sample: typeof SAMPLE_IMAGES[0]) => {
    setSelectedFile({ name: sample.title, size: "Demo Scene", url: sample.url });
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    onImageReady(selectedFile.url, selectedFile.name);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#090A0C] px-4">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 mb-3">
            <Satellite className="h-5 w-5 text-[#5EEAD4]" />
            <span className="font-mono text-[11px] tracking-[0.2em] text-[#5EEAD4] uppercase">Ginkgo · Ingest Imagery</span>
          </div>
          <p className="font-mono text-[10px] text-[#4B5563] tracking-wider uppercase">
            Upload satellite scene — Ginkgo will automatically detect and classify areas of interest
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded border border-dashed p-10 transition-all cursor-pointer",
            isDragging
              ? "border-[#5EEAD4] bg-[#5EEAD4]/5 shadow-[0_0_24px_rgba(94,234,212,0.12)]"
              : selectedFile
              ? "border-[#5EEAD4]/40 bg-[#14161B] cursor-default"
              : "border-white/10 bg-[#0B0C0E] hover:border-white/20 hover:bg-[#14161B]/60"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".tif,.tiff,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="h-8 w-8 rounded-full bg-[#10B981]/15 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-[#10B981]" />
              </div>
              <span className="font-mono text-[12px] font-bold text-[#F5F5F4] truncate max-w-sm">{selectedFile.name}</span>
              <div className="flex gap-4 font-mono text-[10px] text-[#6B7280]">
                <span>SIZE · {selectedFile.size}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                className="mt-1 text-[9px] font-mono text-[#4B5563] hover:text-[#9CA3AF] tracking-wider uppercase transition-colors"
              >
                [ Clear & Pick Different Image ]
              </button>
            </div>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                <UploadCloud className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <div className="text-center">
                <p className="font-mono text-[11px] font-bold text-[#F5F5F4] uppercase tracking-widest">
                  Drop Satellite Image or Click to Browse
                </p>
                <p className="font-mono text-[9px] text-[#4B5563] mt-1 tracking-wider">
                  JPEG · PNG · TIFF · GeoTIFF
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sample picker */}
        <div className="space-y-2">
          <p className="font-mono text-[9px] text-[#4B5563] uppercase tracking-widest text-center">
            Or Use A Sample Image
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_IMAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSample(s)}
                className={cn(
                  "flex flex-col gap-1 rounded border p-2.5 text-left transition-all",
                  selectedFile?.name === s.title
                    ? "border-[#5EEAD4]/50 bg-[#5EEAD4]/5"
                    : "border-white/8 bg-[#14161B] hover:border-white/20 hover:bg-[#1E2129]"
                )}
              >
                <span className="font-mono text-[10px] font-bold text-[#F5F5F4] leading-tight">{s.title}</span>
                <span className="font-mono text-[8px] text-[#4B5563]">{s.locality}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary action */}
        <button
          disabled={!selectedFile}
          onClick={handleAnalyze}
          className={cn(
            "w-full rounded border py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-all",
            selectedFile
              ? "border-[#5EEAD4]/40 bg-[#5EEAD4]/10 text-[#5EEAD4] hover:bg-[#5EEAD4]/15 hover:shadow-[0_0_20px_rgba(94,234,212,0.12)]"
              : "border-white/5 bg-white/3 text-[#4B5563] cursor-not-allowed"
          )}
        >
          {selectedFile ? "[ Analyze Image ]" : "[ Select an Image to Continue ]"}
        </button>
      </div>
    </div>
  );
}
