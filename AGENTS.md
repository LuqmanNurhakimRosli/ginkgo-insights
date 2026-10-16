<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Ginkgo — Enterprise Agentic Development & Architecture Guidelines

This document contains persistent operating instructions for all AI coding agents working on this repository.

---

## 1. Mandatory Documentation Protocol

Whenever any significant architectural, visual, machine learning, or route change is made to this codebase, you **MUST** update the following three files in the same turn:

1. **`system-context.md`**: Update system overview, tech stack, data layers, and active feature sets.
2. **`ai.md`**: Append a new sequential `## Entry N — <Title>` entry summarizing the work executed, audit findings, and newly introduced components.
3. **`AGENTS.md`**: Keep rules, design tokens, and project constraints synchronized.

---

## 2. Design System Standards (Monochrome Enterprise Standard)

- **Brand**: **Ginkgo** (Spatial Decision Intelligence Platform).
- **Base Colors**: Jet Black (`#090A0C`), Dark Zinc (`#14161B` / `#1E2129`), Hairline Borders (`rgba(255, 255, 255, 0.08)`).
- **Typography**: Clean sans-serif (**Inter** from Google Fonts) as primary font; tabular numbers (`num` utility) for metrics; monospace only for formulas, coordinates and IDs.
- **Chroma Role**: Pure monochrome UI chrome. Color is reserved strictly for functional data severity indicators (Emerald `#10B981`, Amber `#F59E0B`, Coral Red `#EF4444`, Sky Blue `#38BDF8`) and the shared 5-class land-cover legend. **No purple or violet on UI chrome.**
- **Active State Tokens**: High-contrast crisp white background with `#090A0C` text or white/10 hover states.
- **Primitives**: use `src/components/gk/ui.tsx` (`Panel`, `PanelHeader`, `Stat`, `ScoreRing`, `RiskBadge`, `Segmented`, `Switch`, `btn.*`, `Page`, `PageHeader`, `EmptyState`) instead of ad-hoc styles.
- **Layout**: Desktop = 72 px icon rail + page; the Map workspace is map + 38 % analysis panel (min 380 px). Mobile = top bar + bottom tab bar (Map, Areas, Copilot, Report, More) and the analysis panel as a bottom sheet. Every page must work at 390 px wide; desktop is the primary target.

---

## 3. Production Architecture & Data Standards

- **Map-first**: areas are selected on the map (search, draw, current view, GeoJSON/KML import). Image upload is not the primary workflow; GeoTIFFs are only accepted when georeferenced and are placed at their true location.
- **Leaflet is client-only**: never `import L from "leaflet"` at module top level (it breaks SSR). Use `loadLeaflet()` from `src/components/map/GinkgoMap.tsx` inside effects.
- **Real data only**: every metric comes from `src/lib/geo/` run on open data (AWS Terrarium SRTM DEM, OpenStreetMap via Overpass). No hard-coded scores, no placeholder overlays, no invented telemetry. If a source is missing, show it as "not connected" (see Data page) rather than faking it.
- **Adapter**: views call `src/services/spatial.ts` (`analyze()`), which wraps the browser engine and keeps the optional FastAPI backend (`backend/`, PyTorch U-Net / RF models) behind health-checked adapters.
- **Riverine scope**: the flood module is *riverine (fluvial) susceptibility* (RFSI = distance to river, height above nearest drainage, flatness). Keep every factor monotonic, keep flatness weight low enough that flat land far from rivers stays Low, and report missing terms (historical floods) instead of filling them.
- **Explainability**: any score shown must have a "why" view listing computed inputs, formula, weight and contribution (`FloodExplain`, livability/suitability breakdowns).
- **AI never generates scores**: LLMs (Gemini/Groq via `src/services/ai/llmProxy.ts`, Ollama local) only narrate the computed JSON context. The default engine is the deterministic on-device analyst.
- **Secrets**: API keys are server-only env vars (`GEMINI_API_KEY`, `GROQ_API_KEY`). Never add a `VITE_`-prefixed secret and never commit `.env`. Do not read `import.meta.env[...]` with bracket notation (it inlines the whole env object into the bundle).
- **Verification before commit**: `npx tsc --noEmit`, `npm run lint`, `bun test tests`, `npm run build`; for model changes also `bun scripts/validate-riverine.ts --fixture` (and the live gate on the Methodology page).
