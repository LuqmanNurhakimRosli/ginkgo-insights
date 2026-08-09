# Ginkgo — System Context & Feature Documentation

Ginkgo is a spatial planning intelligence prototype: temporal satellite analysis,
explainable livability scoring, suitability screening, and an AI planning copilot
that acts on the map. All analysis outputs are mock/indicative data.

## Stack

- TanStack Start v1 (React 19, file-based routing in `src/routes`), Vite 7
- Tailwind CSS v4, CSS-first theme in `src/styles.css` (no `tailwind.config.js`)
- Recharts for radar/donut charts, lucide-react for icons
- No backend: all data is local mock data under `src/data`

## Architecture

| Layer | Location | Purpose |
| --- | --- | --- |
| Types | `src/types/index.ts` | Site, metric, change, AI message, map action contracts |
| Data | `src/data/*` | sites, layers, changeDetection, livability, accessibility, flood, suitability, analysis, reports |
| Services | `src/services/spatial.ts` | All analytical reads over the mock data |
| AI | `src/services/ai/*` | `AIProvider` interface, `mockProvider`, `geminiProvider` stub |
| State | `src/state/ginkgo-store.tsx` | `GinkgoProvider`, `useGinkgo`, `useSelectedSite` — location, selected site, zoom/center, active layers, highlights, T1/T2, chat messages, `thinking`, `analysisRun` |
| Layout | `src/components/layout/*` | `AppShell`, `TopNav` (= `AppHeader`), `PageHeader` |
| Map | `src/components/map/*` | `MapCanvas` (procedural SVG imagery), `MapWorkspace`, `MapComparison`, `MapSearch`, `LayerControl`, `MapToolbar`, `MapSelectionCard`, `MapLegend`, `TimeCompareControl` |
| AI UI | `src/components/ai/*` | `AICopilot`, `AIMessageBubble`, `AISpatialEvidence`, `AIToolAction`, `SuggestedPrompt` |
| Metrics | `src/components/metrics/MetricCard.tsx` | `MetricCard`, `ProgressMetric`, `ScoreCard`, `EvidenceCard` |
| Charts | `src/components/charts/GinkgoCharts.tsx` | `LivabilityRadar`, `LandCoverDonut` |

## Design system

- Surfaces: warm-white background, white cards, hairline borders (60/30/10 palette)
- Accent: Ginkgo teal for primary actions and positive states; orange/red reserved
  for risk (flood exposure, vegetation loss); blue for informational indicators
- Type scale: 10–11px metadata · 11–12px labels (`.label-caps`) · 13px body ·
  16px section headings · 24px page titles. `.num` applies tabular numerals.
- Spacing: 8-point grid — page `px-6 py-6`, column `gap-6`, stack `gap-4`, card `p-4`
- Utilities: `.ginkgo-panel` (card), `.ginkgo-float` (map overlay), `.status-pulse`,
  `.fade-up`

## Map overlay standard

Search top-left · toolbar + layers below it · exactly one contextual card on the
right · time comparison bottom-left · legend strip along the bottom. Minimum 16px
inset from map edges. `MapWorkspace` props: `height`, `overlay`, `showTime`,
`compact` (supporting-context variant used where the map is not the page subject).

## Pages

| Route | Role | Features |
| --- | --- | --- |
| `/` | Dashboard | Slim welcome strip with study-area title and Run Spatial Intelligence action; hero map workspace; six-KPI strip (built-up growth, vegetation, water, green cover, accessibility, resilience); compact Planning workflow index; docked AI Copilot |
| `/analysis` | Map & Analysis | Hero map with land-use overlay, KPI cards, land-cover donut card, docked copilot |
| `/analysis/site/$id` | Site detail | Livability and suitability score cards, radar, dimension progress, "Why this score?" evidence, accessibility & resilience panel, map |
| `/change-detection` | Temporal change | Site and T1/T2 selectors, side-by-side / swipe / overlay modes, change summary with model confidence, narrative, highlight-growth action, change classes with areas |
| `/livability` | Livability Index | Content-dominant: score card, five weighted dimensions, radar profile, "Why {score}?" evidence, study-area comparison card grid, method note; map as supporting inset |
| `/planning` | Suitability | Content-dominant: score card, criteria & weights, planning recommendation with evidence/constraints/actions, Highlight Candidate Areas + Generate Report, indicative-use disclaimer; suitability map inset with legend |
| `/ai-copilot` | Full-screen agent | Full-height map beside a full-height copilot panel |
| `/reports` | Reports & Export | Generated assessment in a contained scrollable document card, PDF/JSON/GeoJSON export actions |
| `/data` | Data Sources | Dataset table: name, location, type, period, updated, status |
| `/settings` | Settings | AI provider, model, weights and feature flags |
| `/help` | Help | Methodology, limitations, FAQ |

## AI Copilot behaviour

1. User asks a question → `askCopilot` sets `thinking` and calls the active `AIProvider`.
2. While working, a human-readable status line is shown; raw tool/function names are
   never rendered to the user.
3. The reply renders: answer text, ✓/⚠ evidence checklist, optional recommendation
   block, and map action buttons (highlight, zoom, layer, compare, report, navigate)
   dispatched through `runMapAction`.
4. The internal tool-call trail is preserved in the message and revealed only via the
   "Show how this was calculated" disclosure, translated to plain language.

## Constraints

- Exported component names, props, hooks, route paths and the `AIProvider` /
  mock-service interfaces are stable contracts — do not rename.
- Mock data files, provider abstraction and Settings feature flags are not to be
  altered by styling work.
- All analysis outputs are indicative and require planner review; the app states this
  wherever a suitability or flood figure is shown.
