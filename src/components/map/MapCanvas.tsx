/**
 * Legacy MapCanvas — kept as a thin wrapper for routes that still reference it.
 * The primary map is now SatelliteMap.tsx (Leaflet).
 */
export function MapCanvas({
  className,
  interactive = true,
  overlay,
}: {
  className?: string | undefined;
  interactive?: boolean | undefined;
  overlay?: "change" | "flood" | "landuse" | "accessibility" | "suitability" | undefined;
}) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#0f0f1a] flex items-center justify-center ${className ?? ""}`}>
      <div className="text-center space-y-2">
        <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-to-br from-[#a78bfa]/20 to-[#7c3aed]/20 flex items-center justify-center">
          <svg className="h-6 w-6 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        </div>
        <p className="text-sm text-[#8b8b9e]">
          {overlay ? `${overlay.charAt(0).toUpperCase() + overlay.slice(1)} View` : "Map View"}
        </p>
        <p className="text-xs text-[#4a4a5e]">Navigate to the main map for satellite view</p>
      </div>
    </div>
  );
}
