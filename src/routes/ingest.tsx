import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type * as LT from "leaflet";
import { FileUp, ImageUp, Lock, ScanSearch, Shapes, Trash2, X } from "lucide-react";
import { loadLeaflet } from "@/components/map/GinkgoMap";
import { btn, Page, PageHeader, Panel, PanelHeader, Spinner } from "@/components/gk/ui";
import { getBasemap } from "@/data/basemaps";
import { MAX_SIDE_M } from "@/lib/geo/analyze";
import {
  parseGeoJson,
  parseGeoTiff,
  parseKml,
  type ImportedBoundary,
  type ImportedRaster,
} from "@/lib/geo/importers";
import { bboxCenter, bboxFromCenter, bboxSizeM, formatArea, formatLatLng } from "@/lib/geo/math";
import { useGinkgo } from "@/state/ginkgo-store";
import type { BBox, LatLng } from "@/types/geo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ingest")({
  head: () => ({
    meta: [
      { title: "Import — Ginkgo" },
      {
        name: "description",
        content:
          "Analyse your own site boundary (GeoJSON / KML) or place a georeferenced GeoTIFF on the map.",
      },
    ],
  }),
  component: ImportPage,
});

const MAX_TIFF_MB = 200;

function DropZone({
  accept,
  onFile,
  icon,
  title,
  hint,
  busy,
}: {
  accept: string;
  onFile: (f: File) => void;
  icon: ReactNode;
  title: string;
  hint: string;
  busy?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
        over ? "border-white bg-white/[0.06]" : "border-white/15",
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06]">
        {busy ? <Spinner className="h-5 w-5" /> : icon}
      </div>
      <div className="text-[13px] font-medium">{title}</div>
      <div className="mt-1 max-w-xs text-[11.5px] leading-snug text-[#94a3b8]">{hint}</div>
      <button
        onClick={() => input.current?.click()}
        disabled={busy}
        className={cn(btn.secondary, "mt-4")}
      >
        <FileUp className="h-3.5 w-3.5" /> Choose file
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PreviewMap({
  bbox,
  ring,
  image,
}: {
  bbox: BBox;
  ring?: LatLng[] | undefined;
  image?: string | undefined;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LT.Map | null>(null);
  useEffect(() => {
    let alive = true;
    void loadLeaflet().then((L) => {
      if (!alive || !el.current) return;
      mapRef.current?.remove();
      const map = L.map(el.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      });
      const base = getBasemap("satellite");
      L.tileLayer(base.url, {
        attribution: base.attribution,
        maxNativeZoom: base.maxNativeZoom,
        maxZoom: 19,
      }).addTo(map);
      const bounds: LT.LatLngBoundsExpression = [
        [bbox.south, bbox.west],
        [bbox.north, bbox.east],
      ];
      if (image) L.imageOverlay(image, bounds, { opacity: 0.95 }).addTo(map);
      if (ring) L.polygon(ring, { color: "#fff", weight: 2, fillOpacity: 0.1 }).addTo(map);
      else
        L.rectangle(bounds, { color: "#fff", weight: 1.5, fill: false, dashArray: "5 5" }).addTo(
          map,
        );
      map.fitBounds(bounds, { padding: [16, 16] });
      mapRef.current = map;
    });
    return () => {
      alive = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [bbox, ring, image]);
  return <div ref={el} className="h-[240px] w-full overflow-hidden rounded-lg bg-[#0d0f12]" />;
}

function ImportPage() {
  const { runAnalysis, setImportedOverlay, importedOverlay, fitBounds } = useGinkgo();
  const navigate = useNavigate();
  const [boundary, setBoundary] = useState<ImportedBoundary | null>(null);
  const [raster, setRaster] = useState<ImportedRaster | null>(null);
  const [busy, setBusy] = useState<"b" | "r" | null>(null);
  const [error, setError] = useState<{ which: "b" | "r"; msg: string } | null>(null);

  const onBoundary = async (f: File) => {
    setError(null);
    setBusy("b");
    try {
      const text = await f.text();
      const name = f.name.replace(/\.[^.]+$/, "");
      setBoundary(/\.kml$/i.test(f.name) ? parseKml(text, name) : parseGeoJson(text, name));
    } catch (err) {
      setError({ which: "b", msg: (err as Error).message || "Could not read this file." });
    } finally {
      setBusy(null);
    }
  };

  const onRaster = async (f: File) => {
    setError(null);
    if (!/\.tiff?$/i.test(f.name)) {
      setError({
        which: "r",
        msg: "PNG/JPEG images carry no coordinates and cannot be placed on the map. Export a GeoTIFF (e.g. from QGIS or SNAP) instead.",
      });
      return;
    }
    if (f.size > MAX_TIFF_MB * 1024 * 1024) {
      setError({
        which: "r",
        msg: `File is larger than ${MAX_TIFF_MB} MB. Clip it to your study area first.`,
      });
      return;
    }
    setBusy("r");
    try {
      setRaster(await parseGeoTiff(await f.arrayBuffer(), f.name));
    } catch (err) {
      setError({ which: "r", msg: (err as Error).message || "Could not read this GeoTIFF." });
    } finally {
      setBusy(null);
    }
  };

  const analyseBoundary = (b: ImportedBoundary) => {
    const { width, height } = bboxSizeM(b.bbox);
    if (width > MAX_SIDE_M || height > MAX_SIDE_M) {
      setError({
        which: "b",
        msg: `Boundary spans more than ${MAX_SIDE_M / 1000} km. Split it into smaller parcels.`,
      });
      return;
    }
    void runAnalysis({
      id: `import-${Date.now().toString(36)}`,
      name: b.name,
      bbox: b.bbox,
      boundary: b.ring,
      source: "import",
      createdAt: Date.now(),
    });
    void navigate({ to: "/" });
  };

  const showRaster = (r: ImportedRaster, analyse: boolean) => {
    setImportedOverlay({ name: r.name, image: r.image, bbox: r.bbox, note: r.note });
    fitBounds(r.bbox);
    if (analyse) {
      const { width, height } = bboxSizeM(r.bbox);
      const bbox =
        width > MAX_SIDE_M || height > MAX_SIDE_M
          ? bboxFromCenter(bboxCenter(r.bbox), 3000)
          : r.bbox;
      void runAnalysis({
        id: `import-${Date.now().toString(36)}`,
        name: r.name.replace(/\.[^.]+$/, ""),
        bbox,
        source: "import",
        createdAt: Date.now(),
      });
    }
    void navigate({ to: "/" });
  };

  const err = (w: "b" | "r") =>
    error?.which === w ? (
      <div
        className="flex items-start gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/[0.07] p-2.5 text-[12px] text-[#fca5a5]"
        role="alert"
      >
        <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {error.msg}
      </div>
    ) : null;

  return (
    <Page
      header={
        <PageHeader
          title="Import"
          description="Analyse an exact site boundary, or place your own satellite GeoTIFF at its true location. The map workspace remains the main way to select areas."
        />
      }
    >
      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-2 lg:p-6">
        <Panel>
          <PanelHeader
            title="Site boundary"
            icon={<Shapes className="h-4 w-4" />}
            hint="GeoJSON or KML polygon in WGS84. Cells outside the boundary are excluded from the statistics."
          />
          <div className="space-y-3 p-4">
            {!boundary ? (
              <DropZone
                accept=".geojson,.json,.kml"
                onFile={(f) => void onBoundary(f)}
                icon={<Shapes className="h-5 w-5" />}
                title="Drop a GeoJSON or KML file"
                hint="Lot or parcel boundaries exported from QGIS, ArcGIS or Google Earth."
                busy={busy === "b"}
              />
            ) : (
              <div className="space-y-3 animate-fade-in">
                <PreviewMap bbox={boundary.bbox} ring={boundary.ring} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">{boundary.name}</div>
                    <div className="text-[11.5px] text-[#94a3b8]">
                      {formatArea(boundary.areaKm2)} · {boundary.ring.length} vertices ·{" "}
                      {formatLatLng(bboxCenter(boundary.bbox), 4)}
                    </div>
                  </div>
                  <button
                    onClick={() => setBoundary(null)}
                    className={btn.icon}
                    aria-label="Remove boundary"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => analyseBoundary(boundary)}
                  className={cn(btn.primary, "w-full")}
                >
                  <ScanSearch className="h-3.5 w-3.5" /> Analyse this boundary
                </button>
              </div>
            )}
            {err("b")}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Satellite imagery"
            icon={<ImageUp className="h-4 w-4" />}
            hint="GeoTIFF in EPSG:4326, EPSG:3857 or a WGS84 UTM zone (Sentinel-2 tiles use UTM 47N/48N over Malaysia)."
          />
          <div className="space-y-3 p-4">
            {!raster ? (
              <DropZone
                accept=".tif,.tiff,image/tiff"
                onFile={(f) => void onRaster(f)}
                icon={<ImageUp className="h-5 w-5" />}
                title="Drop a GeoTIFF"
                hint="RGB or single-band. Rendered with a 2–98 % stretch; large files are downsampled for display."
                busy={busy === "r"}
              />
            ) : (
              <div className="space-y-3 animate-fade-in">
                <PreviewMap bbox={raster.bbox} image={raster.image} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">{raster.name}</div>
                    <div className="text-[11.5px] text-[#94a3b8]">
                      EPSG:{raster.epsg} · {raster.width.toLocaleString()}×
                      {raster.height.toLocaleString()} px · {raster.bands} band
                      {raster.bands > 1 ? "s" : ""}
                    </div>
                    {raster.note && (
                      <div className="mt-1 text-[11px] text-[#64748b]">{raster.note}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setRaster(null)}
                    className={btn.icon}
                    aria-label="Remove imagery"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => showRaster(raster, false)} className={btn.secondary}>
                    Show on map
                  </button>
                  <button onClick={() => showRaster(raster, true)} className={btn.primary}>
                    <ScanSearch className="h-3.5 w-3.5" /> Analyse extent
                  </button>
                </div>
              </div>
            )}
            {err("r")}
            {importedOverlay && !raster && (
              <div className="flex items-center justify-between rounded-lg border border-white/[0.08] px-3 py-2 text-[12px]">
                <span className="truncate">On map: {importedOverlay.name}</span>
                <button onClick={() => setImportedOverlay(null)} className={btn.ghost}>
                  Remove
                </button>
              </div>
            )}
          </div>
        </Panel>

        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] p-4 text-[12px] leading-relaxed text-[#94a3b8] lg:col-span-2">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-white" />
          <span>
            Files are read in your browser and never uploaded. Analysis of an imported area uses the
            same open elevation and OpenStreetMap inputs as any other area; the imagery is shown for
            visual context. Model inference on imagery (PyTorch change detection, land-cover
            classifier) requires the optional Python backend.
          </span>
        </div>
      </div>
    </Page>
  );
}
