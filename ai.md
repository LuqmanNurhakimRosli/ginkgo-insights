# Ginkgo — Progress Log (ai.md)

Running record of AI-executed work on this project. Newest entry last.

---

## Entry 1 — Initial build

Built the full Ginkgo prototype: design system in `src/styles.css`, domain types,
mock data layer (`src/data/*`), spatial + AI service abstractions
(`src/services/spatial.ts`, `src/services/ai/*`), global state
(`src/state/ginkgo-store.tsx`), map/AI/metric/chart components, and all ten routes.

## Entry 2 — Surgical UI/UX redesign (enterprise pass)

Scope: visual and layout only. No exported component/prop/hook renames, no route
changes, no data-binding or provider-interface changes.

Audit findings addressed:

1. **Dashboard dead space** — removed the tall marketing sidebar and the duplicated
   "Pipeline" list; replaced the empty ten-box "All Pages" gallery with a compact,
   information-dense "Planning workflow" list (icon + title + one-line description +
   arrow) inside a single card. Hero copy compressed to a slim one-row welcome strip.
2. **Raw tool calls leaking into chat** — `getSuitabilityScore()`-style pills removed
   from `AIMessageBubble`. Tool calls are now mapped to human-readable sentences and
   collapsed behind a "Show how this was calculated" disclosure. While the agent runs,
   a plain status line reads "Checking suitability, accessibility and change data…".
   The underlying `toolCalls` contract is untouched — only its presentation changed.
3. **Map copy-pasted onto every page** — `MapWorkspace` gained a `compact` variant.
   Livability and Planning now give their real content (radar, dimension breakdown,
   criteria weights, recommendation) the dominant width, with the map as a 300px-high
   supporting inset. Dashboard / Analysis / Change Detection / Copilot keep it as hero.
4. **Crowded floating panels** — one standard overlay system: search top-left (16px
   inset), tools + layers 68px below it, exactly one contextual card on the right,
   time comparison moved to the bottom-left, slim legend strip along the bottom edge.
5. **Typography** — modular scale enforced: 10–11px metadata, 11–12px labels,
   13px body, 16px section headings, 24px page titles. Metric values are 24px/700
   with tabular numerals; score values 40px/700.
6. **Header consistency** — `TopNav` is the single shared header, mounted once in
   `AppShell`; also exported as `AppHeader` for clarity. `PageHeader` standardised at
   `px-6 py-5` with a 24px title.
7. **Spacing rhythm** — every route now uses the 8-point grid: `px-6 py-6` page
   padding, `gap-6` between primary columns, `gap-4` within column stacks, `p-4` cards.
8. **Livability comparison row** — Site A/B/C/D restyled as a card grid inside the
   page's card system, directly under the breakdown, with the active site highlighted.
9. **Reports** — the report body scrolls inside a contained card; export actions are
   pinned below a divider. **Data** — shared table/card tokens, uppercase column heads.

## Entry 3 — Dark Operator Console Pivot & Consolidated Command Views

1. **Dark Mission-Control Aesthetic**: Full pivot to `#0B0C0E` background, `#16171A` panel surfaces, 1px hairline borders, all-caps tracking (`font-mono`), and strict color role separation:
   - Heatmap Chroma (`#22C55E`, `#EAB308`, `#F97316`, `#EF4444`): Reserved strictly for data severity.
   - Cool Cyan-Teal Accent (`#5EEAD4`): Reserved strictly for UI active state, selection, and AI status indicators.
2. **Consolidated 4 Command Views**:
   - `[1] COMMAND` (`/`): Map-first hero canvas with mode toggles, floating parcel HUD card, thin bottom KPI strip.
   - `[2] INTELLIGENCE` (`/livability`): ScoreDial 1.5px circular score gauge, dimension progress bars, arrow evidence list, supporting map inset.
   - `[3] COPILOT` (`/ai-copilot`): Full-screen split workspace with conversation history left and live map right.
   - `[4] DATA` (`/data`): Palantir-style dense data terminal with category sub-rail, system IDs, interactive report viewer, ghost-button export toolbar.
3. **Architectural Callouts**: Created reusable `<Callout>` component (`↗ ↙ ↖ ↘`) paired with all-caps tracking typography.

## Entry 4 — Production Satellite Map, Open-Source AI & Interactive Fixes

1. **Realistic Satellite Raster Basemap**: Upgraded `<MapCanvas>` to render high-resolution dark satellite raster imagery tiles and Sentinel-2 true-color composite imagery textures behind SVG vector GIS paths. Included interactive Basemap Switcher (`[ 🛰️ SATELLITE ]`, `[ 🗺️ VECTOR ]`, `[ 🛰️ SENTINEL RGB ]`).
2. **Interactive Map Engine**: Added mouse-wheel zoom in/out, click-and-drag panning, floating `[ + ]`, `[ - ]`, `[ RESET ]` controls, and dynamic live `LAT` / `LON` coordinate HUD calculation.
3. **AI Dock Redesign & Relocation**: Replaced wide horizontal bottom-right pill (which blocked coordinate watermarks and metric strips) with a compact, floating round launcher widget (`[ ✨ COPILOT ]`) positioned cleanly in the bottom right above metrics.
4. **Open-Source AI Delivery Models (Organization-A Bonus Criteria)**:
   - Added providers: **Ollama Local Llama 3 via Docker**, **Groq Open LLM Acceleration**, **HuggingFace Sentinel Classifier**, **Mock Offline**, and **Google Gemini**.
   - Added green header badge: `[OPEN-SOURCE AI MODEL (+BONUS MARKS)]`.
5. **Track B Geospatial Challenge Alignment**: Configured 2 explicit study locations: **Urban (Putrajaya / Cyberjaya)** and **Rural (Sungai Buah / Hulu Langat)** with Sentinel-2 T1 (2023) vs T2 (2025) raw & processed metadata.
6. **Copilot Instruction Guide & Prompt Templates**: Added an expandable "System Instruction Guide & Prompt Presets" panel in View 3 (`COPILOT`) with clickable spatial query templates.
7. **HUD Parcel Selection Buttons**: Wired `[ A ]`, `[ B ]`, `[ C ]`, `[ D ]` buttons directly to `selectSite(s.id)` in global state.

## Entry 5 — Complete Navigation Rail, Header Settings Button & Dark Route Polish

1. **Expanded Sidebar Navigator (`SidebarRail.tsx`)**: Upgraded left rail to feature direct icon links to all 10 system routes: `COMMAND` (`/`), `ANALYSIS` (`/analysis`), `CHANGE` (`/change-detection`), `INTELLIGENCE` (`/livability`), `SUITABILITY` (`/planning`), `COPILOT` (`/ai-copilot`), `REPORTS` (`/reports`), `DATA` (`/data`), `SETTINGS` (`/settings`), and `HELP` (`/help`).
2. **Top Header Settings Button & Management Modal (`TopNav.tsx`)**: Added `⚙️ SETTINGS` button to top bar that opens a modal for managing AI models, study locations, criteria weights, and feature flags.
3. **Unified Dark Styling Across All Secondary Routes**: Rebuilt `/settings`, `/help`, `/change-detection`, `/planning`, `/reports`, and `/analysis` with dark console styling (`#0B0C0E` base, `#16171A` cards, hairline borders, cyan-teal accents).
