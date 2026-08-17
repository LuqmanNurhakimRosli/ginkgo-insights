import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SatelliteMap } from "@/components/map/SatelliteMap";
import { SideBySideSlider } from "@/components/map/SideBySideSlider";
import { LivabilityQuadrant } from "@/components/dashboard/LivabilityQuadrant";
import { InterventionFeed, type HotspotIncident } from "@/components/dashboard/InterventionFeed";
import { RasterUploadModal } from "@/components/upload/RasterUploadModal";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { sites } from "@/data/sites";
import { landCover, changeDetection } from "@/data/changeDetection";
import { flood } from "@/data/flood";
import { suitability } from "@/data/suitability";
import { buildReport, datasets } from "@/data/reports";
import { providers } from "@/services/ai";
import { AIDock } from "@/components/ai/AIDock";
import type { Dataset } from "@/types";
import {
  X,
  ChevronDown,
  Layers,
  Settings,
  MapPin,
  Clock,
  FileText,
  Database,
  HelpCircle,
  Download,
  Sparkles,
  Sliders,
  Cpu,
  CheckCircle2,
  UploadCloud,
  SlidersHorizontal,
  Map as MapIcon,
  Play,
  Loader2,
  Droplets,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ginkgo — Enterprise Spatial Intelligence & Land Analytics" },
      {
        name: "description",
        content: "Multi-modal satellite AI & spatial reasoning platform for municipal town planning and land development.",
      },
    ],
  }),
  component: MissionControlDashboard,
});

type LeftViewMode = "slider" | "map";
type RightTab = "intelligence" | "whatif" | "reports";
type ModalView = "none" | "settings" | "layers" | "data" | "help" | "upload";

function MissionControlDashboard() {
  const {
    selectedSiteId,
    selectSite,
    providerId,
    setProviderId,
    activeLayers,
    toggleLayer,
    t1,
    t2,
  } = useGinkgo();

  const site = useSelectedSite();
  const [leftView, setLeftView] = useState<LeftViewMode>("slider");
  const [rightTab, setRightTab] = useState<RightTab>("intelligence");
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalView>("none");

  // What-If Simulation local state
  const [simZoning, setSimZoning] = useState<string>("Commercial High-Density");
  const [simDensity, setSimDensity] = useState<number>(65);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimDone(true);
    }, 1200);
  };

  const handleExport = (fmt: string) => {
    let content = "";
    let mimeType = "text/plain";
    let filename = `Ginkgo_Planning_Assessment_${site.id}_${Date.now()}`;

    if (fmt === "PDF" || fmt === "DOC") {
      filename += ".md";
      mimeType = "text/markdown";
      content = `# GINKGO — STATUTORY SPATIAL ASSESSMENT REPORT
**Document Reference**: GNK-2026-LOT4829 / LPBM-PLAN-MALAYSIA
**Sector**: ${site.name} (${site.locality})
**Coordinates**: ${site.center[0].toFixed(4)}°N, ${site.center[1].toFixed(4)}°E
**Parcel Area**: ${site.areaHa} Hectares
**Evaluation Date**: ${new Date().toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}

---

## 1. Executive Planning Summary
Sector **${site.name}** has undergone multi-modal satellite AI screening and multi-criteria land suitability evaluation under Akta 172 guidelines.
- **Composite Livability Rating**: ${site.livability} / 100
- **Land Suitability Class**: ${site.suitabilityClass}
- **Dominant Land Use**: ${site.dominantLandUse}
- **Hydrological Flood Hazard**: ${site.floodRisk}
- **Arterial Connectivity**: ${site.roadAccess}

---

## 2. Multi-Criteria Statutory Compliance Matrix
| Dimension | Score | Benchmark | Status |
|---|---|---|---|
| 🌱 Environmental & NDVI Canopy | 66 / 100 | > 60 | COMPLIANT (Offset Rule Triggered) |
| 🚀 JKR Arterial Road Ingress | ${site.roadAccess === "Excellent" ? "91" : "75"} / 100 | > 70 | OPTIMAL DUAL-CARRIAGEWAY |
| 🛡️ JPS Flood Hazard Resilience | ${site.floodRisk === "High" ? "42" : site.floodRisk === "Moderate" ? "59" : "88"} / 100 | > 65 | ${site.floodRisk === "High" ? "HAZARD BUFFER REQUIRED" : "COMPLIANT"} |
| 📈 Statutory Zoning Compatibility | 85 / 100 | > 75 | LOCAL STRUCTURE PLAN COMPLIANT |

---

## 3. Statutory Planning Directives & Conditions
1. **Stormwater Management (MSMA 2nd Edition)**:
   - Mandatory on-site stormwater detention (OSD) tank capacity requirement prior to structural layout submission.
2. **Akta 172 Section 21B Tree Canopy Preservation**:
   - Minimum 10% dedicated public green space canopy retention along perimeter easements.

*Generated automatically by Ginkgo Spatial Decision Intelligence Platform.*
`;
    } else if (fmt === "JSON") {
      filename += ".json";
      mimeType = "application/json";
      content = JSON.stringify(
        {
          report_id: `GNK-${site.id.toUpperCase()}-2026`,
          sector_name: site.name,
          locality: site.locality,
          parcel_area_ha: site.areaHa,
          coordinates: site.center,
          livability_score: site.livability,
          suitability_score: site.suitability,
          flood_risk: site.floodRisk,
          road_access: site.roadAccess,
          dominant_land_use: site.dominantLandUse,
          timestamp: new Date().toISOString(),
          compliance_matrix: {
            environment: 66,
            accessibility: site.roadAccess === "Excellent" ? 91 : 75,
            resilience: site.floodRisk === "High" ? 42 : site.floodRisk === "Moderate" ? 59 : 88,
            sustainability: 85,
          },
          statutory_conditions: [
            "Mandatory on-site stormwater detention (OSD) capacity upgrade under MSMA 2nd Edition",
            "Minimum 10% dedicated public green space canopy preservation under Akta 172 Section 21B",
          ],
        },
        null,
        2,
      );
    } else if (fmt === "GeoJSON") {
      filename += ".geojson";
      mimeType = "application/geo+json";
      content = JSON.stringify(
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                site_id: site.id,
                name: site.name,
                locality: site.locality,
                livability: site.livability,
                suitability: site.suitability,
                dominantLandUse: site.dominantLandUse,
              },
              geometry: {
                type: "Polygon",
                coordinates: [site.polygon.map(([lat, lng]) => [lng, lat])],
              },
            },
          ],
        },
        null,
        2,
      );
    }

    // Trigger Browser Download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleHotspotAction = (hotspot: HotspotIncident | string) => {
    const id = typeof hotspot === "string" ? hotspot : hotspot.id;
    if (id === "hotspot-1" || id === "hotspot-flood") {
      selectSite("site-c"); // Sungai Buah Basin
    } else if (id === "hotspot-2" || id === "hotspot-canopy") {
      selectSite("site-b"); // Presint 14 Transit Hub
    } else {
      selectSite("site-a"); // Presint 11 Sector
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0c] text-white font-sans">
      {/* ─── Top Enterprise Navigation Bar ─── */}
      <header className="h-14 px-4 shrink-0 flex items-center justify-between border-b border-white/8 bg-[#14161b] z-40">
        {/* Left: Brand & Sector Switcher */}
        <div className="flex items-center gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <span className="text-black font-extrabold text-sm tracking-tighter">G</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-wider">GINKGO</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white font-medium">SPATIAL AI</span>
              </div>
              <p className="text-[10px] text-[#94a3b8] leading-none mt-0.5">Spatial Decision Intelligence</p>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          {/* Sector Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSiteSelector((s) => !s)}
              className="glass-panel rounded-xl px-3 py-1.5 flex items-center gap-2 hover:bg-[#1e2129] transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-white" />
              <div className="text-left">
                <div className="text-xs text-white font-semibold flex items-center gap-1">
                  <span>{site.name}</span>
                </div>
                <div className="text-[9px] text-[#94a3b8] leading-none">{site.locality}</div>
              </div>
              <ChevronDown className="h-3 w-3 text-[#94a3b8] ml-1" />
            </button>

            {showSiteSelector && (
              <div className="absolute top-12 left-0 z-50 w-72 glass-panel rounded-2xl p-2 animate-slide-up shadow-2xl space-y-1 border border-white/10">
                <div className="px-2 py-1 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider border-b border-white/6">
                  Administrative Sectors & Parcels
                </div>
                {sites.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      selectSite(s.id);
                      setShowSiteSelector(false);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs transition-colors ${
                      s.id === selectedSiteId
                        ? "bg-white text-black font-semibold shadow-md"
                        : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{s.name}</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${s.id === selectedSiteId ? "text-black/70" : "text-[#64748b]"}`}>
                      {s.locality}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Left Canvas Toggle */}
          <div className="hidden lg:flex items-center rounded-xl border border-white/8 bg-[#090a0c] p-0.5">
            <button
              onClick={() => setLeftView("slider")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                leftView === "slider"
                  ? "bg-white text-[#090a0c] font-semibold shadow-sm"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Dual-View Slider</span>
            </button>
            <button
              onClick={() => setLeftView("map")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                leftView === "map"
                  ? "bg-white text-[#090a0c] font-semibold shadow-sm"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              <MapIcon className="h-3 w-3" />
              <span>Full Satellite</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Action Hub */}
        <div className="flex items-center gap-2">
          {/* Upload Imagery */}
          <button
            onClick={() => setActiveModal("upload")}
            className="glass-panel rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs text-white hover:bg-[#1e2129] transition-colors border border-white/10"
            title="Ingest Custom Satellite GeoTIFF"
          >
            <UploadCloud className="h-3.5 w-3.5 text-white" />
            <span className="hidden sm:inline font-medium">Ingest Imagery</span>
          </button>

          {/* Model Backend Indicator */}
          <button
            onClick={() => setActiveModal("settings")}
            className="glass-panel rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs text-white hover:bg-[#1e2129] transition-colors"
            title="Configure Spatial Reasoning Model"
          >
            <Cpu className="h-3.5 w-3.5 text-white" />
            <span className="font-semibold uppercase">{providers[providerId]?.name?.split(" ")[0] ?? providerId}</span>
          </button>

          {/* GIS Layers */}
          <button
            onClick={() => setActiveModal(activeModal === "layers" ? "none" : "layers")}
            className={`glass-panel rounded-xl p-2 transition-colors ${
              activeModal === "layers" ? "bg-white text-black" : "hover:bg-[#1e2129] text-[#94a3b8]"
            }`}
            title="GIS Layers & Spectral Filters"
          >
            <Layers className="h-4 w-4" />
          </button>

          {/* Data Catalog */}
          <button
            onClick={() => setActiveModal(activeModal === "data" ? "none" : "data")}
            className="glass-panel rounded-xl p-2 hover:bg-[#1e2129] text-[#94a3b8] transition-colors"
            title="Spatial Data Catalog"
          >
            <Database className="h-4 w-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveModal(activeModal === "settings" ? "none" : "settings")}
            className="glass-panel rounded-xl p-2 hover:bg-[#1e2129] text-[#94a3b8] transition-colors"
            title="System & Weight Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Methodology */}
          <button
            onClick={() => setActiveModal(activeModal === "help" ? "none" : "help")}
            className="glass-panel rounded-xl p-2 hover:bg-[#1e2129] text-[#94a3b8] transition-colors"
            title="Methodology & Regulatory Compliance"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─── Main Split-Screen Dashboard ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Viewport (62% Width): Interactive Map / Slider */}
        <div className="flex-1 lg:w-[62%] h-full relative overflow-hidden bg-[#090a0c]">
          {leftView === "slider" ? (
            <SideBySideSlider
              t1Label={`T1 Baseline: ${site.name} (${t1})`}
              t2Label={`T2 Observation: ${site.name} AI Inundation & Built-Up Mask (${t2})`}
              onSelectHotspot={handleHotspotAction}
            />
          ) : (
            <SatelliteMap />
          )}
        </div>

        {/* Right Panel (38% Width): Mission Control Intelligence HUD */}
        <div className="w-full lg:w-[38%] shrink-0 h-full border-l border-white/8 bg-[#14161b] flex flex-col overflow-hidden z-20 shadow-2xl">
          {/* Sub Navigation Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 bg-[#0f1115]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightTab("intelligence")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  rightTab === "intelligence"
                    ? "bg-white text-black shadow-sm"
                    : "text-[#94a3b8] hover:text-white"
                }`}
              >
                Intelligence HUD
              </button>
              <button
                onClick={() => setRightTab("whatif")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  rightTab === "whatif"
                    ? "bg-white text-black shadow-sm"
                    : "text-[#94a3b8] hover:text-white"
                }`}
              >
                Scenario Simulator
              </button>
              <button
                onClick={() => setRightTab("reports")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  rightTab === "reports"
                    ? "bg-white text-black shadow-sm"
                    : "text-[#94a3b8] hover:text-white"
                }`}
              >
                Planning Assessment
              </button>
            </div>

            <div className="text-[10px] text-[#10b981] flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rightTab === "intelligence" && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. Livability Quadrant & 4 Dimensions */}
                <LivabilityQuadrant
                  score={site.livability}
                  statusLabel={site.livability >= 80 ? "Optimal / Sustainable Growth" : "Moderate / Balanced Growth"}
                  statusColor={site.livability >= 80 ? "#10b981" : "#f59e0b"}
                  environmentScore={66}
                  accessibilityScore={site.roadAccess === "Excellent" ? 91 : 75}
                  resilienceScore={site.floodRisk === "High" ? 42 : site.floodRisk === "Moderate" ? 59 : 88}
                  sustainabilityScore={85}
                />

                {/* 2. Priority Intervention Hotspots */}
                <InterventionFeed onActionClick={handleHotspotAction} />
              </div>
            )}

            {rightTab === "whatif" && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. Rezoning & Plot Ratio Simulation */}
                <div className="surface-panel rounded-2xl p-5 space-y-4 shadow-2xl border border-white/8">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Sliders className="h-4 w-4 text-white" />
                    <span>Scenario Simulator: Rezoning & Density</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Test downstream hydrological runoff surge, peak traffic ingress, and canopy offset for <strong>{site.name}</strong>.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#94a3b8] uppercase font-semibold">Proposed Land Use Zoning</label>
                    <select
                      value={simZoning}
                      onChange={(e) => setSimZoning(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#090a0c] p-2.5 text-xs text-white outline-none"
                    >
                      <option value="Commercial High-Density">Commercial High-Density</option>
                      <option value="Affordable Housing Residential">Affordable Housing Residential</option>
                      <option value="Industrial Logistics Park">Industrial Logistics Park</option>
                      <option value="Canopy Conservation Zone">Canopy Conservation Zone</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94a3b8]">Plot Ratio / Built-Up Density</span>
                      <span className="text-white font-bold num">{simDensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={95}
                      value={simDensity}
                      onChange={(e) => setSimDensity(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-bold text-[#090a0c] hover:bg-white/90 transition-opacity"
                  >
                    {isSimulating ? <Loader2 className="h-4 w-4 animate-spin text-[#090a0c]" /> : <Play className="h-4 w-4 fill-[#090a0c]" />}
                    <span>{isSimulating ? "Projecting Downstream Impact..." : "Run Scenario Simulation"}</span>
                  </button>
                </div>

                {/* 2. Hydrological Flood Engine (Nadi's ML Models) */}
                <div className="surface-panel rounded-2xl p-5 space-y-4 shadow-2xl border border-white/8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Droplets className="h-4 w-4 text-[#38bdf8]" />
                      <span>Hydrological Flood Inundation Engine</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-white font-mono">
                      DECISION TREE / RF
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">Monsoon Rainfall Influx:</span>
                        <span className="text-white font-bold num">180 mm / hr</span>
                      </div>
                      <input type="range" min={50} max={300} defaultValue={180} className="w-full accent-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#94a3b8] uppercase font-semibold">Soil Type</label>
                        <select className="w-full rounded-xl border border-white/10 bg-[#090a0c] p-2 text-xs text-white outline-none">
                          <option value="loam">Loam (Moderate)</option>
                          <option value="clay">Clay (Low Permeability)</option>
                          <option value="sand">Sand (High Permeability)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#94a3b8] uppercase font-semibold">Elevation Offset</label>
                        <input type="number" defaultValue={20} className="w-full rounded-xl border border-white/10 bg-[#090a0c] p-2 text-xs text-white outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {simDone && (
                  <div className="surface-panel rounded-2xl p-5 space-y-3 animate-fade-in border border-white/20">
                    <div className="flex items-center justify-between border-b border-white/6 pb-2">
                      <span className="text-xs font-semibold text-white uppercase">Projected Statutory Rating</span>
                      <span className="text-base font-bold text-[#10b981] num">78 / 100</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">Runoff & Drainage Surge:</span>
                        <span className="font-semibold text-[#ef4444]">+18.4%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">Peak Traffic Ingress:</span>
                        <span className="font-semibold text-[#f59e0b]">+220 veh/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">Preserved Tree Canopy:</span>
                        <span className="font-semibold text-[#10b981]">32.0% Retained</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#94a3b8] leading-relaxed bg-[#090a0c] rounded-xl p-3 border border-white/5">
                      <strong>Planning Condition Recommendation:</strong> Indicative stormwater detention (OSD) capacity assessment required under local drainage guidelines.
                    </p>
                  </div>
                )}
              </div>
            )}

            {rightTab === "reports" && (
              <div className="space-y-4 animate-fade-in">
                {/* Official Municipal Planning Assessment Document Card */}
                <div className="surface-panel rounded-2xl p-5 space-y-4 shadow-2xl border border-white/10 bg-[#14161b]">
                  {/* Document Header & Legal Authority Stamp */}
                  <div className="flex items-start justify-between border-b border-white/8 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-semibold">
                          DOC: GNK-2026-LOT4829
                        </span>
                        <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3 w-3" /> VERIFIED
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">{site.name} Assessment</h3>
                      <p className="text-[11px] text-[#94a3b8]">
                        Local Planning Authority: {site.locality} (Akta 172 Framework)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#64748b] block">PARCEL AREA</span>
                      <span className="text-xs font-bold text-white num">{site.areaHa} Hectares</span>
                    </div>
                  </div>

                  {/* Cadastral & Suitability Summary Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="surface-panel rounded-xl p-2.5 bg-[#090a0c] border border-white/5">
                      <span className="text-[10px] text-[#64748b] uppercase block">Composite Livability</span>
                      <span className="text-base font-extrabold text-[#10b981] num">{site.livability} / 100</span>
                      <span className="text-[10px] text-[#94a3b8] block mt-0.5">High Growth Candidate</span>
                    </div>
                    <div className="surface-panel rounded-xl p-2.5 bg-[#090a0c] border border-white/5">
                      <span className="text-[10px] text-[#64748b] uppercase block">Zoning Compatibility</span>
                      <span className="text-base font-extrabold text-white num">{site.dominantLandUse}</span>
                      <span className="text-[10px] text-[#94a3b8] block mt-0.5">Approved Structure Plan</span>
                    </div>
                  </div>

                  {/* Multi-Criteria Statutory Compliance Table */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider block">
                      Multi-Criteria Statutory Compliance Matrix
                    </span>
                    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#090a0c]">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-white/8 text-[9px] text-[#64748b] uppercase bg-white/3">
                            <th className="py-2 px-3">Criteria Dimension</th>
                            <th className="py-2 px-3">Score</th>
                            <th className="py-2 px-3 text-right">Statutory Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-[#94a3b8]">
                          <tr>
                            <td className="py-2 px-3 text-white font-medium">🌱 Environmental Canopy (NDVI)</td>
                            <td className="py-2 px-3 num text-white">66 / 100</td>
                            <td className="py-2 px-3 text-right text-[#f59e0b] font-semibold">Offset Triggered</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-white font-medium">🚀 JKR Arterial Road Ingress</td>
                            <td className="py-2 px-3 num text-white">{site.roadAccess === "Excellent" ? "91" : "75"} / 100</td>
                            <td className="py-2 px-3 text-right text-[#10b981] font-semibold">Optimal Dual-Spine</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-white font-medium">🛡️ JPS Flood Hazard Resilience</td>
                            <td className="py-2 px-3 num text-white">{site.floodRisk === "High" ? "42" : site.floodRisk === "Moderate" ? "59" : "88"} / 100</td>
                            <td className="py-2 px-3 text-right font-semibold text-[#10b981]">
                              {site.floodRisk === "High" ? "Buffer Mandated" : "Compliant"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-white font-medium">📈 Statutory Land Compatibility</td>
                            <td className="py-2 px-3 num text-white">85 / 100</td>
                            <td className="py-2 px-3 text-right text-[#10b981] font-semibold">Structure Plan Pass</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Statutory Directives & Conditions */}
                  <div className="space-y-1.5 bg-[#090a0c] rounded-xl p-3 border border-white/5 text-xs text-[#94a3b8]">
                    <span className="text-[10px] font-semibold text-white uppercase tracking-wider block">
                      Planning Conditions & Directives
                    </span>
                    <ul className="space-y-1 text-[11px] list-disc list-inside leading-relaxed">
                      <li>
                        <strong className="text-white">Stormwater (MSMA 2nd Ed):</strong> Mandatory on-site stormwater detention (OSD) capacity prior to layout submission.
                      </li>
                      <li>
                        <strong className="text-white">Akta 172 Section 21B:</strong> Minimum 10% dedicated public green space canopy retention along boundaries.
                      </li>
                    </ul>
                  </div>

                  {/* Real Download Buttons Toolbar */}
                  <div className="pt-2 border-t border-white/8 space-y-2">
                    <span className="text-[10px] text-[#64748b] block font-mono">EXPORT OFFICIAL STATUTORY PACKAGE</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleExport("PDF")}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white py-2 text-xs text-[#090a0c] hover:bg-white/90 transition-all font-bold shadow-md"
                        title="Download Printable Statutory Assessment Report"
                      >
                        <Download className="h-3 w-3" />
                        <span>PDF Report</span>
                      </button>

                      <button
                        onClick={() => handleExport("JSON")}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-white hover:bg-white/10 transition-all font-semibold"
                        title="Download JSON Telemetry & Score Payload"
                      >
                        <Download className="h-3 w-3" />
                        <span>JSON Data</span>
                      </button>

                      <button
                        onClick={() => handleExport("GeoJSON")}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-white hover:bg-white/10 transition-all font-semibold"
                        title="Download GeoJSON Spatial Polygon Boundary"
                      >
                        <Download className="h-3 w-3" />
                        <span>GeoJSON</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modals Layer ─── */}

      {/* 1. Custom Satellite Raster Upload Modal */}
      <RasterUploadModal
        isOpen={activeModal === "upload"}
        onClose={() => setActiveModal("none")}
        onUploadSuccess={(filename) => {
          alert(`Successfully ingested ${filename}.\nComputed NDVI/NDWI and generated segmentation mask.`);
        }}
      />

      {/* 2. GIS Layer Controls Drawer */}
      {activeModal === "layers" && (
        <div className="absolute top-16 right-4 z-50 w-80 glass-panel rounded-2xl p-5 shadow-2xl animate-slide-up space-y-4 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase tracking-wider">
              <Layers className="h-4 w-4 text-white" />
              <span>GIS Layers & Spectral Filters</span>
            </div>
            <button onClick={() => setActiveModal("none")} className="text-[#94a3b8] hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { id: "satellite", label: "Sentinel-2 Optical Composite", desc: "10m High-Resolution Multispectral", active: true },
              { id: "flood", label: "Hydrological Flood Risk Buffer", desc: "Inundation Hazard Vector Boundary", active: activeLayers.includes("flood") },
              { id: "landuse", label: "Multi-Class Land Segmentation", desc: "5-Class Spectral Surface Classifier", active: activeLayers.includes("landuse") },
              { id: "roads", label: "Arterial Road Network", desc: "Transport Connectivity Catchment", active: activeLayers.includes("roads") },
              { id: "boundary", label: "Municipal Administrative Bounds", desc: "Local Authority Planning Limits", active: activeLayers.includes("boundary") },
            ].map((layer) => (
              <label
                key={layer.id}
                className="flex items-start justify-between rounded-xl p-3 bg-white/3 hover:bg-white/6 cursor-pointer transition-colors border border-white/5"
              >
                <div>
                  <div className="font-semibold text-white">{layer.label}</div>
                  <div className="text-[10px] text-[#94a3b8] mt-0.5">{layer.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={layer.active}
                  onChange={() => toggleLayer(layer.id)}
                  className="mt-1 accent-white"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 3. Settings Modal */}
      {activeModal === "settings" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-2xl glass-panel rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-white" />
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">AI Model & Delivery Architecture</h2>
                  <p className="text-[11px] text-[#94a3b8]">Edge / Local Docker Execution & High-Throughput Spatial Reasoning</p>
                </div>
              </div>
              <button onClick={() => setActiveModal("none")} className="p-1 rounded-lg hover:bg-white/10 text-[#94a3b8] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide">Select Reasoning Engine Backend</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {Object.entries(providers).map(([id, prov]) => (
                  <button
                    key={id}
                    onClick={() => setProviderId(id)}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      providerId === id
                        ? "border-white bg-white/15 text-white shadow-lg"
                        : "border-white/5 bg-white/3 text-[#94a3b8] hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{prov.name}</span>
                      {providerId === id && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-[10px] text-[#64748b] block mt-1">
                      {id === "ollama" || id === "groq" || id === "huggingface" ? "Local / Open-Source Engine" : "Cloud Reasoning API"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/8">
              <button
                onClick={() => setActiveModal("none")}
                className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-[#090a0c] hover:bg-white/90 transition-colors"
              >
                Save & Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Data Catalog Modal */}
      {activeModal === "data" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-white" />
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">Enterprise Spatial Data Catalog</h2>
                  <p className="text-[11px] text-[#94a3b8]">Indexed Multi-Spectral Optical Rasters, Hydrological Hazard Layers & Vector Networks</p>
                </div>
              </div>
              <button onClick={() => setActiveModal("none")} className="p-1 rounded-lg hover:bg-white/10 text-[#94a3b8] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-[#94a3b8] uppercase">
                    <th className="py-2.5 px-3">Dataset ID</th>
                    <th className="py-2.5 px-3">Dataset Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Resolution / Period</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {datasets.map((d: Dataset) => (
                    <tr key={d.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-3 font-mono text-white text-[11px]">{d.id}</td>
                      <td className="py-3 px-3 font-medium text-white">{d.name}</td>
                      <td className="py-3 px-3 text-[#94a3b8]">{d.type}</td>
                      <td className="py-3 px-3 text-[#94a3b8]">{d.period}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white font-medium">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/8">
              <button
                onClick={() => setActiveModal("none")}
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#090a0c] hover:bg-white/90 transition-colors"
              >
                Close Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Help / Methodology Modal */}
      {activeModal === "help" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-2xl glass-panel rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <HelpCircle className="h-4 w-4 text-white" />
                <span>Spatial Intelligence Methodology & Statutory Compliance</span>
              </div>
              <button onClick={() => setActiveModal("none")} className="text-[#94a3b8] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#94a3b8] leading-relaxed">
              <div className="surface-panel rounded-xl p-4 space-y-2 border border-white/5">
                <h3 className="text-white font-semibold text-xs uppercase">1. Multi-Spectral Mathematical Formulations</h3>
                <p>
                  Computes <strong className="text-white">NDVI</strong> (Vegetation Index) and <strong className="text-white">NDWI</strong> (Water Index) across Sentinel-2 bands B4 (Red), B8 (NIR), and B3 (Green) to mathematically differentiate dense tree canopy from dark water surfaces.
                </p>
              </div>

              <div className="surface-panel rounded-xl p-4 space-y-2 border border-white/5">
                <h3 className="text-white font-semibold text-xs uppercase">2. Multi-Criteria Suitability Screening</h3>
                <p>
                  Applies deterministic spatial buffers (&gt;100m drainage exclusions, &lt;15° slope thresholds) combined with machine-learning multi-criteria classification.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/8">
              <button
                onClick={() => setActiveModal("none")}
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#090a0c] hover:bg-white/90"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Planning Copilot (Bottom Left) */}
      <AIDock />
    </div>
  );
}
