import { Layers, X } from "lucide-react";
import { BASEMAPS } from "@/data/basemaps";
import { RISK_COLORS } from "@/lib/geo/flood";
import { LAND_COLORS, LAND_LABELS } from "@/lib/geo/render";
import { useGinkgo, type LayerId } from "@/state/ginkgo-store";
import { LandClass } from "@/types/geo";
import { Switch } from "@/components/gk/ui";
import { cn } from "@/lib/utils";

const OVERLAYS: Array<{ id: LayerId; label: string; hint: string }> = [
  {
    id: "flood",
    label: "Riverine flood susceptibility",
    hint: "RFSI classes from DEM + OSM rivers",
  },
  { id: "rivers", label: "Rivers & drains", hint: "OpenStreetMap waterways" },
  { id: "landcover", label: "Land use / land cover", hint: "OSM tags → 5-class legend" },
  { id: "terrain", label: "Terrain (hillshade)", hint: "SRTM ground surface" },
  { id: "pois", label: "Facilities & transit", hint: "Schools, health, stops (OSM)" },
  { id: "labels", label: "Place labels", hint: "On satellite basemap" },
];

export function MapLayersPanel({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  const { settings, updateSettings, layers, setLayer, analysis, importedOverlay } = useGinkgo();
  return (
    <div
      className={cn(
        "glass w-[300px] max-w-[calc(100vw-24px)] rounded-xl animate-slide-up",
        className,
      )}
      role="dialog"
      aria-label="Map layers"
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-[12.5px] font-semibold">
          <Layers className="h-4 w-4" /> Map layers
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-[#94a3b8] hover:bg-white/10 hover:text-white"
          aria-label="Close layers"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[min(70vh,520px)] space-y-3 overflow-y-auto p-3 scroll-thin">
        <div>
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#64748b]">
            Basemap
          </div>
          <div className="grid grid-cols-5 gap-1">
            {BASEMAPS.map((b) => (
              <button
                key={b.id}
                onClick={() => updateSettings({ basemap: b.id })}
                aria-pressed={settings.basemap === b.id}
                className={cn(
                  "rounded-md border px-1 py-1.5 text-[10.5px] font-medium",
                  settings.basemap === b.id
                    ? "border-white bg-white text-[#090a0c]"
                    : "border-white/10 text-[#cbd5e1] hover:bg-white/[0.06]",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#64748b]">
            Analysis overlays
          </div>
          <div className="divide-y divide-white/[0.06]">
            {OVERLAYS.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block text-[12.5px] text-white">{o.label}</span>
                  <span className="block text-[10.5px] text-[#64748b]">{o.hint}</span>
                </span>
                <Switch
                  checked={layers[o.id]}
                  onChange={(v) => setLayer(o.id, v)}
                  label={o.label}
                />
              </label>
            ))}
            {importedOverlay && (
              <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] text-white">
                    Imported: {importedOverlay.name}
                  </span>
                  <span className="block text-[10.5px] text-[#64748b]">
                    Your GeoTIFF (this session)
                  </span>
                </span>
                <Switch
                  checked={layers.imported}
                  onChange={(v) => setLayer("imported", v)}
                  label="Imported imagery"
                />
              </label>
            )}
            <div
              className="flex items-center justify-between gap-3 py-2 opacity-60"
              title="Requires verified JPS / DID flood-extent data"
            >
              <span className="min-w-0">
                <span className="block text-[12.5px] text-white">Historical flood extent</span>
                <span className="block text-[10.5px] text-[#64748b]">
                  Not connected — needs JPS Infobanjir / DID data access
                </span>
              </span>
              <Switch
                checked={false}
                onChange={() => undefined}
                label="Historical flood extent"
                disabled
              />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-[#64748b]">
            <span>Overlay opacity</span>
            <span className="num normal-case text-[#cbd5e1]">
              {Math.round(settings.layerOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={settings.layerOpacity}
            onChange={(e) => updateSettings({ layerOpacity: Number(e.target.value) })}
            className="w-full"
            aria-label="Overlay opacity"
          />
        </div>
        {!analysis && (
          <p className="text-[11px] leading-snug text-[#64748b]">
            Overlays appear after an area is analysed.
          </p>
        )}
      </div>
    </div>
  );
}

export function MapLegend({ className }: { className?: string }) {
  const { layers, analysis } = useGinkgo();
  if (!analysis) return null;
  const showFlood = layers.flood;
  const showLc = layers.landcover && !showFlood;
  if (!showFlood && !layers.landcover && !layers.rivers) return null;
  return (
    <div className={cn("glass rounded-lg px-2.5 py-2 text-[10.5px]", className)}>
      {showFlood && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-white">Riverine susceptibility</span>
          {(["High", "Moderate", "Low"] as const).map((c) => (
            <span key={c} className="flex items-center gap-1 text-[#cbd5e1]">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: RISK_COLORS[c] }}
              />
              {c}
            </span>
          ))}
        </div>
      )}
      {showLc && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-white">Land cover</span>
          {[
            LandClass.BuiltUp,
            LandClass.Vegetation,
            LandClass.Water,
            LandClass.Agriculture,
            LandClass.Bare,
          ].map((c) => (
            <span key={c} className="flex items-center gap-1 text-[#cbd5e1]">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: LAND_COLORS[c] }}
              />
              {LAND_LABELS[c]}
            </span>
          ))}
        </div>
      )}
      {layers.rivers && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-[#cbd5e1]",
            (showFlood || showLc) && "mt-1",
          )}
        >
          <span className="h-[3px] w-4 rounded bg-[#38BDF8]" /> River / canal
          <span className="ml-2 h-[2px] w-4 rounded bg-[#7dd3fc]" /> Stream / drain
        </div>
      )}
    </div>
  );
}
