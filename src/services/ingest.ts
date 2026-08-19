// ─── Ingest Imagery — Detection & Report Service ────────────────────────────
// Adapter-first design: mock now, real ML model swap later.
// Real swap: replace detectHighlightedAreas() body with a POST to
//   /api/ingest/detect — zero UI changes required.

import type {
  HighlightedArea,
  IngestionSession,
  IngestCategory,
} from "@/types/ingest";

// ─── Mock data stagger helper ────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Plausible mock areas for any uploaded image ─────────────────────────────
function buildMockAreas(imageWidth: number, imageHeight: number): HighlightedArea[] {
  const w = imageWidth;
  const h = imageHeight;

  return [
    {
      area_id: "area-1",
      label: "Area 1",
      bounding_box: { x: Math.round(w * 0.05), y: Math.round(h * 0.08), width: Math.round(w * 0.28), height: Math.round(h * 0.30) },
      category: "HIGH_SUITABILITY",
      suitability_score: 84,
      livability_index: 79,
      flood_risk_score: 18,
      explanation:
        "Strong road proximity and low flood exposure index detected. Vegetation canopy retention above the Akta 172 10% threshold. Suitable topography with minimal slope gradient.",
      suggested_action:
        "Consider for medium-density residential development (Plot Ratio ≤ 2.5). Require On-Site Stormwater Detention (OSD) design per MSMA 2nd Edition.",
    },
    {
      area_id: "area-2",
      label: "Area 2",
      bounding_box: { x: Math.round(w * 0.40), y: Math.round(h * 0.12), width: Math.round(w * 0.32), height: Math.round(h * 0.25) },
      category: "CONDITIONAL",
      suitability_score: 62,
      livability_index: 58,
      flood_risk_score: 51,
      explanation:
        "Moderate impervious surface density detected with limited arterial road ingress. NDWI index indicates seasonal water retention in the eastern margin. Requires hydrological assessment.",
      suggested_action:
        "Conditional approval only. Mandate JPS-certified flood study and 50m river reserve buffer (RW CEKAL Clause 4.3) before any earthworks approval.",
    },
    {
      area_id: "area-3",
      label: "Area 3",
      bounding_box: { x: Math.round(w * 0.10), y: Math.round(h * 0.55), width: Math.round(w * 0.22), height: Math.round(h * 0.28) },
      category: "FLOOD_EXPOSED",
      suitability_score: 28,
      livability_index: 31,
      flood_risk_score: 87,
      explanation:
        "Significant inundation risk detected. Low elevation profile combined with high NDWI spectral signature and proximity to main drainage channel. This zone is within a high-hazard flood corridor.",
      suggested_action:
        "Do not approve for permanent development. Recommend designation as Kawasan Sensitif Alam Sekitar (KSAS) Level 2 flood buffer zone. Consider managed wetland or retention basin use.",
    },
    {
      area_id: "area-4",
      label: "Area 4",
      bounding_box: { x: Math.round(w * 0.65), y: Math.round(h * 0.50), width: Math.round(w * 0.25), height: Math.round(h * 0.35) },
      category: "HIGH_SUITABILITY",
      suitability_score: 88,
      livability_index: 85,
      flood_risk_score: 14,
      explanation:
        "Elevated terrain with high vegetation NDVI and strong transit corridor access detected. Minimal impervious surface encroachment. Structurally sound for mixed-use densification.",
      suggested_action:
        "Prime candidate for sustainable mixed-use transit-oriented development (TOD) under RS Selangor 2035 Policy. Retain minimum 15% green canopy per local plan requirement.",
    },
  ];
}

// ─── Detect highlighted areas (Mock → Real adapter) ──────────────────────────
export async function detectHighlightedAreas(
  imageUrl: string,
  filename: string,
  dimensions: { width: number; height: number }
): Promise<IngestionSession> {
  // Simulate progressive detection delay (2.5s total)
  await sleep(2500);

  const areas = buildMockAreas(dimensions.width, dimensions.height);

  const breakdown: Partial<Record<IngestCategory, number>> = {};
  for (const a of areas) {
    breakdown[a.category] = (breakdown[a.category] ?? 0) + 1;
  }

  return {
    source_image_id: `ing-${Date.now()}`,
    source_image_url: imageUrl,
    source_filename: filename,
    ingested_at: new Date().toISOString(),
    areas,
    overview: {
      total_areas: areas.length,
      category_breakdown: breakdown,
      summary:
        "This satellite scene depicts a peri-urban corridor with diverse land-use conditions. Two zones demonstrate high suitability for sustainable development with strong road connectivity and low flood exposure. One zone presents conditional development potential requiring hydrological mitigation. One zone is identified as a high-priority flood corridor and should be excluded from development proposals under current statutory frameworks.",
    },
  };
}

// ─── Get areas incrementally (for animation stagger) ─────────────────────────
export async function* detectAreasProgressive(
  imageUrl: string,
  filename: string,
  dimensions: { width: number; height: number }
): AsyncGenerator<HighlightedArea> {
  const session = await detectHighlightedAreas(imageUrl, filename, dimensions);
  for (const area of session.areas) {
    await sleep(400);
    yield area;
  }
}

// ─── Generate PDF/JSON/GeoJSON downloads ────────────────────────────────────
export function generateIngestReportMarkdown(session: IngestionSession): string {
  const lines: string[] = [];

  lines.push(`# GINKGO — SPATIAL PLANNING ASSESSMENT REPORT`);
  lines.push(`**Document ID:** GNK-ING-${session.source_image_id.toUpperCase()}`);
  lines.push(`**Source Image:** ${session.source_filename}`);
  lines.push(`**Analysis Date:** ${new Date(session.ingested_at).toLocaleDateString("en-MY")}`);
  lines.push(`**Total Areas Detected:** ${session.overview.total_areas}`);
  lines.push(``);
  lines.push(`## Executive Summary`);
  lines.push(session.overview.summary);
  lines.push(``);
  lines.push(`## Category Breakdown`);
  for (const [cat, count] of Object.entries(session.overview.category_breakdown)) {
    lines.push(`- ${cat.replace(/_/g, " ")}: ${count}`);
  }
  lines.push(``);

  for (const area of session.areas) {
    lines.push(`---`);
    lines.push(`## ${area.label} — ${area.category.replace(/_/g, " ")}`);
    lines.push(`| Metric | Score |`);
    lines.push(`|---|---|`);
    lines.push(`| Suitability Score | ${area.suitability_score} / 100 |`);
    lines.push(`| Livability Index | ${area.livability_index} / 100 |`);
    lines.push(`| Flood Risk Score | ${area.flood_risk_score} / 100 |`);
    lines.push(``);
    lines.push(`**AI Spatial Assessment:**`);
    lines.push(area.explanation);
    lines.push(``);
    lines.push(`**Suggested Planning Action:**`);
    lines.push(area.suggested_action);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`## Disclaimer`);
  lines.push(
    `This is a decision-support prototype. AI-generated insights and spatial suitability results should be reviewed by qualified planning professionals and should not be interpreted as statutory planning approval under Akta 172 (Town & Country Planning Act 1976).`
  );

  return lines.join("\n");
}

export function downloadIngestReport(session: IngestionSession, format: "pdf" | "json" | "geojson") {
  if (format === "json") {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    triggerDownload(blob, `ginkgo-ingest-${session.source_image_id}.json`);
    return;
  }

  if (format === "geojson") {
    const features = session.areas.map((area) => ({
      type: "Feature",
      properties: {
        area_id: area.area_id,
        label: area.label,
        category: area.category,
        suitability_score: area.suitability_score,
        livability_index: area.livability_index,
        flood_risk_score: area.flood_risk_score,
      },
      geometry: {
        type: "Polygon",
        coordinates: [bboxToCoords(area.bounding_box)],
      },
    }));

    const geojson = { type: "FeatureCollection", features };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    triggerDownload(blob, `ginkgo-ingest-${session.source_image_id}.geojson`);
    return;
  }

  // PDF: generate Markdown and download as .md (browser-printable)
  const md = generateIngestReportMarkdown(session);
  const blob = new Blob([md], { type: "text/plain" });
  triggerDownload(blob, `ginkgo-ingest-report-${session.source_image_id}.md`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function bboxToCoords(bb: { x: number; y: number; width: number; height: number }) {
  // Returns pixel-space rectangle as GeoJSON ring (not real lon/lat — placeholder until georeferencing)
  return [
    [bb.x, bb.y],
    [bb.x + bb.width, bb.y],
    [bb.x + bb.width, bb.y + bb.height],
    [bb.x, bb.y + bb.height],
    [bb.x, bb.y],
  ];
}
