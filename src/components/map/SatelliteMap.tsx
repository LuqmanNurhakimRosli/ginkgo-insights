import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { sites } from "@/data/sites";

// Esri World Imagery — free satellite tiles, no API key required
const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTR =
  "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics";

// Risk level color mapping
const riskColor: Record<string, string> = {
  Low: "#4ade80",
  Moderate: "#fbbf24",
  High: "#f87171",
};

const suitabilityColor: Record<string, string> = {
  "Highly Suitable": "#4ade80",
  Suitable: "#60a5fa",
  Conditional: "#fbbf24",
  "Low Suitability": "#f87171",
};

export function SatelliteMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);
  const { selectedSiteId, selectSite, analysisState } = useGinkgo();
  const selectedSite = useSelectedSite();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [2.9264, 101.6964], // Putrajaya
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
      maxZoom: 18,
      minZoom: 5,
    });

    // Add satellite tile layer
    L.tileLayer(SATELLITE_TILE_URL, {
      attribution: SATELLITE_ATTR,
      maxZoom: 18,
    }).addTo(map);

    // Add zoom control (bottom-right)
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Create polygon layer group
    const polygonLayer = L.layerGroup().addTo(map);
    polygonLayerRef.current = polygonLayer;

    mapRef.current = map;

    // Force resize after mount
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw site polygons
  const drawPolygons = useCallback(() => {
    if (!polygonLayerRef.current) return;
    polygonLayerRef.current.clearLayers();

    sites.forEach((site) => {
      const isSelected = site.id === selectedSiteId;
      const isAnalyzed = analysisState === "complete";
      const fillColor = isAnalyzed
        ? suitabilityColor[site.suitabilityClass] ?? "#60a5fa"
        : "rgba(255,255,255,0.15)";

      const polygon = L.polygon(
        site.polygon.map(([lat, lng]) => [lat, lng] as L.LatLngExpression),
        {
          color: isSelected ? "#ffffff" : "rgba(255,255,255,0.3)",
          weight: isSelected ? 2.5 : 1,
          fillColor,
          fillOpacity: isSelected ? 0.35 : isAnalyzed ? 0.25 : 0.08,
          dashArray: isSelected ? undefined : "4 4",
        }
      );

      // Tooltip
      polygon.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#fff">${site.name}</div>
         <div style="font-family:Inter,sans-serif;font-size:10px;color:#8b8b9e">${site.locality}</div>
         ${
           isAnalyzed
             ? `<div style="font-family:Inter,sans-serif;font-size:10px;color:${riskColor[site.floodRisk]};margin-top:4px">Flood: ${site.floodRisk} · Livability: ${site.livability}/100</div>`
             : ""
         }`,
        {
          sticky: true,
          className: "ginkgo-tooltip",
          direction: "top",
          offset: [0, -10],
        }
      );

      polygon.on("click", () => {
        selectSite(site.id);
      });

      polygon.addTo(polygonLayerRef.current!);
    });
  }, [selectedSiteId, selectSite, analysisState]);

  useEffect(() => {
    drawPolygons();
  }, [drawPolygons]);

  // Fly to selected site
  useEffect(() => {
    if (!mapRef.current || !selectedSite) return;
    mapRef.current.flyTo(
      selectedSite.center as L.LatLngExpression,
      15,
      { duration: 1.2 }
    );
  }, [selectedSite]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Custom tooltip styling */}
      <style>{`
        .ginkgo-tooltip {
          background: rgba(15, 17, 21, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #ffffff !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
        }
        .ginkgo-tooltip::before {
          border-top-color: rgba(15, 17, 21, 0.95) !important;
        }
        .leaflet-tooltip-top:before {
          border-top-color: rgba(26, 26, 46, 0.92) !important;
        }
      `}</style>
    </>
  );
}
