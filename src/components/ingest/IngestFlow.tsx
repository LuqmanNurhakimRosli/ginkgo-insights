import { useState } from "react";
import type { IngestionSession, IngestState, HighlightedArea } from "@/types/ingest";
import { detectHighlightedAreas } from "@/services/ingest";
import { IngestUpload } from "./IngestUpload";
import { IngestPreprocessing } from "./IngestPreprocessing";
import { IngestDashboard } from "./IngestDashboard";
import { IngestReport } from "./IngestReport";

// State machine for the 4-state ingest flow
export function IngestFlow() {
  const [state, setState] = useState<IngestState>("UPLOAD");
  const [session, setSession] = useState<IngestionSession | null>(null);
  const [pendingImage, setPendingImage] = useState<{ url: string; filename: string } | null>(null);

  const handleImageReady = (imageUrl: string, filename: string) => {
    setPendingImage({ url: imageUrl, filename });
    setState("PREPROCESSING");
  };

  const handlePreprocessingComplete = async (areas: HighlightedArea[]) => {
    if (!pendingImage) return;

    // Build full session from the detected areas
    // (detectHighlightedAreas is already called inside IngestPreprocessing progressively;
    //  here we assemble the complete session object)
    const img = new Image();
    img.src = pendingImage.url;
    await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });

    const fullSession = await detectHighlightedAreas(
      pendingImage.url,
      pendingImage.filename,
      { width: img.naturalWidth || 800, height: img.naturalHeight || 600 }
    );

    // Override areas with already-rendered ones to keep bounding boxes consistent
    setSession({ ...fullSession, areas });
    setState("DASHBOARD");
  };

  const handleReset = () => {
    setState("UPLOAD");
    setSession(null);
    setPendingImage(null);
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#090A0C]">
      {state === "UPLOAD" && (
        <IngestUpload onImageReady={handleImageReady} />
      )}

      {state === "PREPROCESSING" && pendingImage && (
        <IngestPreprocessing
          imageUrl={pendingImage.url}
          filename={pendingImage.filename}
          onComplete={handlePreprocessingComplete}
        />
      )}

      {state === "DASHBOARD" && session && (
        <IngestDashboard
          session={session}
          onGenerateReport={() => setState("REPORT")}
        />
      )}

      {state === "REPORT" && session && (
        <IngestReport
          session={session}
          onBack={() => setState("DASHBOARD")}
        />
      )}
    </div>
  );
}
