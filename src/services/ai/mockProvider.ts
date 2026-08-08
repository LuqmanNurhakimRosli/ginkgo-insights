import { spatialService } from "@/services/spatial";
import { getSite } from "@/data/sites";
import { changeDetection } from "@/data/changeDetection";
import { livability } from "@/data/livability";
import { flood } from "@/data/flood";
import { accessibility } from "@/data/accessibility";
import { recommendations, suitability } from "@/data/suitability";
import type { AIProvider, AIRequest, AIResponse } from "./types";

const has = (text: string, ...words: string[]) =>
  words.some((w) => text.includes(w));

/**
 * MockAIProvider — deterministic spatial agent used when no backend is wired.
 * It performs real tool calls against the spatial service and returns map
 * actions, so the AI → map interaction is genuine, not simulated text.
 */
export const mockAIProvider: AIProvider = {
  id: "mock",
  name: "Mock AI",

  async send({ prompt, siteId }: AIRequest): Promise<AIResponse> {
    const q = prompt.toLowerCase();
    const site = getSite(siteId)!;

    if (has(q, "flood", "risk", "accessib", "poor access")) {
      if (has(q, "flood") && has(q, "access")) {
        const risk = await spatialService.findHighRiskAreas();
        const low = await spatialService.findLowAccessibilityAreas();
        const ids = new Set(low.map((f) => f.siteId));
        const overlap = risk.filter((f) => ids.has(f.siteId));
        return {
          text: `${overlap.length} areas meet both conditions: elevated flood exposure and below-threshold accessibility. These should be treated as constrained for new residential capacity.`,
          evidence: overlap.map((f) => `${f.label} — ${f.value}`),
          toolCalls: [
            { name: "getFloodRisk", status: "done" },
            { name: "getAccessibility", status: "done" },
            { name: "computeSpatialOverlap", status: "done" },
            { name: "highlightMap", args: { count: overlap.length }, status: "done" },
          ],
          features: overlap,
          actions: [
            {
              id: "show-overlap",
              label: `Show ${overlap.length} Areas on Map`,
              kind: "highlight",
              payload: { layer: "flood" },
            },
          ],
        };
      }
      if (has(q, "accessib", "poor access")) {
        const low = await spatialService.findLowAccessibilityAreas();
        return {
          text: `${low.length} areas fall below the 70/100 accessibility threshold. Weak arterial connection is the dominant driver in both cases.`,
          evidence: low.map((f) => `${f.label} — ${f.value}`),
          toolCalls: [
            { name: "findLowAccessibilityAreas", status: "done" },
            { name: "highlightMap", status: "done" },
          ],
          features: low,
          actions: [
            { id: "show-low-access", label: `Show ${low.length} Areas on Map`, kind: "highlight", payload: { layer: "roads" } },
          ],
        };
      }
      const risk = await spatialService.findHighRiskAreas();
      const fl = flood[siteId]!;
      return {
        text: `${site.name} records ${fl.exposure.toLowerCase()} indicative flood exposure across ${fl.exposedAreaKm2} km², with a resilience indicator of ${fl.resilienceIndicator}/100. ${risk.length} study areas show non-low exposure overall.`,
        evidence: fl.factors.map((f) => `${f.label}: ${f.level} — ${f.note}`),
        constraints: ["Indicative screening only — planner review required."],
        toolCalls: [
          { name: "getFloodRisk", args: { siteId }, status: "done" },
          { name: "findHighRiskAreas", status: "done" },
        ],
        features: risk,
        actions: [
          { id: "show-flood", label: `Highlight ${risk.length} Exposed Areas`, kind: "highlight", payload: { layer: "flood" } },
        ],
      };
    }

    if (has(q, "built-up", "built up", "growth", "expansion")) {
      const growth = await spatialService.findHighGrowthAreas();
      const cd = changeDetection[siteId]!;
      return {
        text: `Between ${cd.t1} and ${cd.t2}, built-up area at ${site.name} grew ${cd.builtUpPct}% (${cd.changedAreaHa} ha) at ${cd.confidence}% model confidence. ${cd.narrative}`,
        evidence: growth.map((f) => `${f.label} — ${f.value}`),
        toolCalls: [
          { name: "getChangeDetection", args: { siteId }, status: "done" },
          { name: "findHighGrowthAreas", status: "done" },
        ],
        features: growth,
        actions: [
          { id: "show-growth", label: "Highlight Built-up Growth", kind: "highlight", payload: { layer: "change" } },
          { id: "open-change", label: "Open Change Detection", kind: "navigate", payload: { to: "/change-detection" } },
        ],
      };
    }

    if (has(q, "vegetation", "green", "tree")) {
      const cd = changeDetection[siteId]!;
      return {
        text: `Vegetation at ${site.name} declined ${Math.abs(cd.vegetationPct)}% between ${cd.t1} and ${cd.t2}, the largest losses sitting adjacent to new built-up parcels.`,
        evidence: [
          `Vegetation loss ${cd.classes.find((c) => c.id === "vegloss")?.areaHa} ha`,
          `Built-up increase ${cd.classes.find((c) => c.id === "builtup")?.areaHa} ha`,
          "Loss is concentrated on the fringe of the growth corridor",
        ],
        toolCalls: [{ name: "getLandCover", args: { siteId }, status: "done" }],
        actions: [
          { id: "veg-layer", label: "Show Vegetation Change Layer", kind: "layer", payload: { layer: "change" } },
        ],
      };
    }

    if (has(q, "why", "explain", "score of", "livability")) {
      const lv = livability[siteId]!;
      return {
        text: `${site.name} scores ${lv.score}/100 (${lv.band}). The index is a weighted composite: ${lv.dimensions.map((d) => `${d.label} ${d.score}/${d.weight}`).join(", ")}.`,
        evidence: lv.positives,
        constraints: lv.negatives,
        toolCalls: [
          { name: "getLivabilityScore", args: { siteId }, status: "done" },
          { name: "getIndicatorDefinition", args: { indicatorId: "livability" }, status: "done" },
        ],
        actions: [
          { id: "open-livability", label: "View Evidence", kind: "navigate", payload: { to: "/livability" } },
        ],
      };
    }

    if (has(q, "compare")) {
      const other = siteId === "site-b" ? "site-a" : "site-b";
      const cmp = await spatialService.compareSites(siteId, other);
      return {
        text: `Comparing ${cmp.a.name} and ${cmp.b.name}: ${cmp.rows.map((r) => `${r.label} ${r.a} vs ${r.b}`).join("; ")}.`,
        evidence: cmp.rows.map((r) => `${r.label}: ${cmp.a.name} ${r.a} · ${cmp.b.name} ${r.b}`),
        toolCalls: [{ name: "compareSites", args: { a: siteId, b: other }, status: "done" }],
        features: [
          { id: `cmp-${cmp.a.id}`, siteId: cmp.a.id, label: cmp.a.name, kind: "candidate", polygon: cmp.a.polygon },
          { id: `cmp-${cmp.b.id}`, siteId: cmp.b.id, label: cmp.b.name, kind: "candidate", polygon: cmp.b.polygon },
        ],
        actions: [{ id: "show-cmp", label: "Show Both Sites on Map", kind: "highlight" }],
      };
    }

    if (has(q, "report")) {
      return {
        text: `A full Ginkgo Spatial Planning Assessment for ${site.name} is ready to generate. It compiles temporal change, land cover, accessibility, flood resilience, livability and suitability into one reviewable document.`,
        toolCalls: [{ name: "generateReport", args: { siteId }, status: "done" }],
        actions: [{ id: "open-report", label: "Open Report Preview", kind: "report", payload: { siteId } }],
      };
    }

    if (has(q, "prioriti", "where should", "sustainable", "housing", "residential", "develop", "suitab")) {
      const candidates = await spatialService.findCandidateAreas();
      const su = suitability[siteId]!;
      const rec = recommendations[siteId]!;
      const ac = accessibility[siteId]!;
      return {
        text: `Based on current spatial indicators, ${candidates.length} candidate zones show relatively strong accessibility, moderate flood exposure and suitable environmental conditions. ${site.name} itself scores ${su.score}/100 (${su.classification}).`,
        evidence: [
          `Road accessibility ${ac.score}/100 (${ac.roadAccess})`,
          `Flood exposure ${flood[siteId]!.exposure} — manageable with mitigation`,
          "Existing urban connectivity in place",
          `Livability ${livability[siteId]!.score}/100`,
        ],
        constraints: rec.constraints,
        recommendation: { title: rec.headline, actions: rec.actions.slice(0, 4) },
        toolCalls: [
          { name: "getSuitabilityScore", args: { siteId }, status: "done" },
          { name: "getAccessibility", args: { siteId }, status: "done" },
          { name: "getFloodRisk", args: { siteId }, status: "done" },
          { name: "findCandidateAreas", status: "done" },
          { name: "highlightMap", args: { count: candidates.length }, status: "done" },
        ],
        features: candidates,
        actions: [
          { id: "highlight-candidates", label: "Highlight Candidate Areas", kind: "highlight", payload: { layer: "landuse" } },
          { id: "compare", label: "Compare Areas", kind: "compare" },
          { id: "report", label: "Generate Report", kind: "report", payload: { siteId } },
        ],
      };
    }

    const lv = livability[siteId]!;
    return {
      text: `${site.name} (${site.areaHa} ha, ${site.dominantLandUse}) currently scores ${lv.score}/100 on the livability index with ${flood[siteId]!.exposure.toLowerCase()} indicative flood exposure and ${accessibility[siteId]!.score}/100 accessibility. Ask about growth, vegetation, flood exposure, accessibility, suitability, or request a report.`,
      evidence: lv.positives,
      constraints: lv.negatives,
      toolCalls: [{ name: "getSiteSummary", args: { siteId }, status: "done" }],
      actions: [
        { id: "zoom-site", label: `Zoom to ${site.name}`, kind: "zoom", payload: { siteId } },
      ],
    };
  },
};
