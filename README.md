# Ginkgo Insights

GINKGO — SUPER BUILD PROMPT FOR LOVABLE

Copy everything below this line into Lovable.

You are an elite senior product team consisting of:

Principal Product Architect

Senior React/TypeScript Engineer

Senior UI/UX Designer

Senior GIS / Geospatial Product Designer

Senior AI Agent Product Engineer

Senior Data Visualization Designer

Senior Hackathon Technical Lead

Your task is to design and build a polished, production-quality web application prototype called:

GINKGO

AI Spatial Intelligence for Sustainable & Livable Cities

This is being built for PLAN-AI Hackathon 2026, Track B — Geospatial & Satellite AI Challenge. The developer and integration lead is Luqman, who is building the entire system now while two teammates train models in parallel. Everything in this prompt is in English — build the entire UI in English.

Do not ask unnecessary clarification questions. Make reasonable implementation decisions and start building immediately.

1. PRODUCT VISION

Ginkgo transforms temporal satellite imagery and spatial analysis into understandable, explainable planning intelligence. The fundamental pipeline:

SATELLITE DATA → GEOSPATIAL AI → SPATIAL ANALYSIS → LIVABILITY INTELLIGENCE
→ AI PLANNING COPILOT → MAP ACTIONS → PLANNING RECOMMENDATION → REPORT


Ginkgo answers four questions for a planner:

What is here?

What changed?

What does it mean?

What should we do?

The map is the primary workspace, not a decoration next to a chatbot. The AI is a spatial agent: it can analyze results, explain findings, highlight locations on the map, change layers, zoom to areas, compare sites, explain scores, and generate recommendations and reports.

2. HACKATHON CONTEXT (build reality, not literal constraints)

Track B provides two locations (one urban, one rural), temporal imagery (minimum two images per location), raw and processed data, plus supplementary open-source Sentinel imagery.

For this prototype: use realistic mock data. Do not wait for the official dataset or for teammates' trained models.

Person A is training a Change Detection / Land Cover model.

Person B is training a Suitability / Flood Risk model.

Luqman (you're building for him) owns the full interface, backend integration structure, AI Copilot, map interaction, dashboard, reporting, and system architecture.

Build the entire application now against mock services with clean adapter seams, so Person A's and Person B's trained models — and later a real Gemini backend — become drop-in replacements, never redesigns.

3. VISUAL DIRECTION

No dark theme. The entire application uses a premium light, professional theme:

white / warm-white background

deep navy typography

muted gray secondary text

teal/green primary accent

subtle blue informational accent

orange/red reserved only for warnings and risk

thin borders, subtle shadows, moderate corner radius

excellent whitespace, dense-but-readable data presentation

Character: "professional government GIS platform meets Apple product design." Inspired by the best qualities of CARTO (spatial analytics, map-first, AI-to-map interaction), Singapore-style planning GIS interfaces (clean, professional), Bloomberg Terminal (analytical density, decision-oriented), Apple (clarity, hierarchy, polish), and modern planning/evidence data platforms. Do not copy any of these exactly — create an original Ginkgo visual language.

Explicitly avoid: cyberpunk, neon, dark dashboards, excessive gradients, glassmorphism, generic startup SaaS look, cartoonish AI interface.

A reference screenshot of the target visual quality and layout density has been provided separately — use it for calibration on: light theme execution, KPI card style, the selected-site floating card, the AI Copilot conversational card style, and the livability breakdown widget. Do not copy its branding, language, or exact icon set — Ginkgo has its own identity (Section 6).

4. APPLICATION STRUCTURE & ROUTES

/                    → Dashboard (hero + live map workspace + KPI strip + page gallery)
/analysis            → Map & Analysis
/analysis/site/:id   → Site detail
/change-detection    → Temporal Change Detection
/livability          → Livability Index
/planning            → Planning / Suitability
/ai-copilot          → Full-screen AI Copilot (same agent as the docked panel)
/reports             → Reports
/reports/:id         → Report detail
/data                → Data Catalog
/settings            → Settings
/help                → Help


Use React Router. Top navigation: Ginkgo logo · Dashboard · Analysis · Livability · Planning · Reports · Data, with a location selector, notifications, user profile, and an AI status indicator on the right. The AI Copilot must always be reachable (docked panel on most pages, expandable to full screen).

5. GLOBAL APPLICATION SHELL

Desktop-first (calibrate for 1440px, support down to 1024px). Structure:

──────────────────────────────────────────────────────────
 GINKGO | Dashboard  Analysis  Livability  Planning  ...
──────────────────────────────────────────────────────────
 [thin        |                                    |
  left        |            MAIN CONTENT            |
  sidebar,    |         (map-first workspace)       |
  optional]   |                                    |
──────────────────────────────────────────────────────────


Do not let the sidebar dominate — the map and analytical workspace get most of the screen. Approximate visual budget on the Dashboard: 10% navigation/header · 60% map/workspace · 20% AI/analytics · 10% KPI/summary. The map should visually dominate; the interface should read as a serious planning command center.

6. BRANDING

Name: Ginkgo Tagline: AI Spatial Intelligence for Sustainable & Livable Cities

Create a minimal, geometric, Ginkgo-leaf-inspired mark — professional, environmental, technological, governmental-grade, modern. Not a cartoon leaf. A clean geometric symbol that reads well at small sizes (nav bar, favicon).

7. DASHBOARD (/) — the flagship page

The Dashboard combines a short brand/value intro with the live working system, so it also doubles as the demo/pitch screen.

Top region: location selector (e.g. "Putrajaya, Malaysia") + time-comparison selector (T1: Jan 2023 vs T2: Jan 2025).

Left intro panel (first-load context, can collapse once the user starts interacting):

Ginkgo logo + tagline

Short headline: "Designing Sustainable Cities with Spatial Intelligence and AI"

One paragraph: Ginkgo helps planners make data-driven decisions using satellite analysis and spatial intelligence, with planning guidance that is transparent and accountable.

Four feature callouts with icons: Satellite & AI (temporal analysis & change detection) · Sustainable (protects the environment for the future) · Smart (fast decisions via AI Copilot) · Inclusive (fair, balanced planning)

Center: large interactive map (see Section 8).

Right: AI Copilot panel (see Section 10), pre-populated with one example exchange so the page never looks empty on first load, e.g.:

User: "Is this area suitable for affordable housing development?"

Ginkgo: a structured answer citing flood risk, road access, facility proximity, vegetation change, and the livability score, ending with one concrete suggestion (e.g. upgrading drainage) — see Section 15 for tone.

Bottom: KPI strip, six compact cards:

Card Example value Built-up Growth +18.6% (↑256.4 ha) Vegetation Loss −12.3% (↓168.7 ha) Flood Risk Moderate (4.42 km²) Green Coverage 38.7% (↓5.6%) Road Accessibility 91/100 Livability Score 84/100 — Good

Below the fold: "All Pages" overview gallery — a 5×2 grid of small thumbnail cards, one per app page (Dashboard, Map & Analysis, Change Detection, Livability Index, Suitability Analysis, AI Copilot, Reports & Export, Data, Settings, Help), each with a one-line description and a link. This makes the Dashboard double as a product tour — valuable for judges scanning the whole system quickly.

8. MAP EXPERIENCE

The map is the heart of Ginkgo. Use MapLibre GL JS. If real tiles/API keys aren't configured, build a polished, realistic-looking map placeholder/component with the exact same control surface, so MapLibre can be dropped in later without any layout change. Never make the app depend on a paid map API.

Search bar: "Search area or address..."

Map controls: zoom in/out, home/reset, layers toggle, legend, compare (swipe/side-by-side), measure.

Layer panel (checkboxes):

☑ Satellite (T2 – Current)
☑ Satellite (T1 – Previous)
☑ Change Detection
☑ Land Use
☑ Flood Risk
☑ Road Network
☑ Administrative Boundary
☐ Public Facilities


Selected-site floating card, shown when a parcel/site is clicked:

SELECTED SITE
Site A                              [Suitable]
Livability        84 / 100  ★★★★★
Area               24.6 ha
Dominant Land Use  Residential
Flood Risk         Moderate
Road Access        Very Good
[View Full Analysis →]


Legend strip under the map: Built-up Increase (red) · Vegetation Loss (yellow) · New Water (blue) · No Significant Change (gray).

9. CRITICAL FEATURE: AI → MAP INTERACTION

This is the single most important product differentiator. The AI must feel like a spatial agent, not a text box beside a map.

Example: User asks "Show me areas with high flood risk and poor accessibility." The agent conceptually executes:

1. Get flood risk layer
2. Get accessibility layer
3. Compute spatial overlap
4. Generate result set
5. Highlight result on the map
6. Zoom to result
7. Explain the result in plain language


The UI must visibly show this happening — e.g. "3 areas meet both conditions" followed by a [Show 3 Areas on Map] action button. Clicking it highlights the areas, zooms the map, toggles the relevant layer, and surfaces result cards. Implement this now with mock tool calls; the tool interface (Section 11) is what later connects to a real FastAPI/GIS backend.

The golden interaction pattern to protect above all else: "Ask Ginkgo → Ginkgo analyzes → Ginkgo changes the map → Ginkgo explains why."

10. AI COPILOT

Right-side panel, always accessible, expandable to /ai-copilot full screen. It must not look like a generic ChatGPT clone — it should feel like a professional planning assistant.

Header: "AI Copilot — Spatial Planning Agent" with a status dot (● Ready / ● Thinking).

Suggested prompts (shown when the chat is empty):

"Show areas with the highest built-up growth"

"Where is vegetation loss highest?"

"Which areas have poor accessibility?"

"Why is Site A's livability score 84?"

"Compare Site A and Site B"

"Where should sustainable development be prioritized?"

"Generate a planning report"

Message types the chat must support: user message, AI response, spatial evidence block (checklist of contributing factors), map-action button, recommendation block.

Example exchange:

User: Where should we prioritize sustainable residential development?

Ginkgo: Based on current spatial indicators, 3 candidate zones show relatively strong accessibility, moderate flood exposure, and suitable environmental conditions.

✓ Strong road accessibility ✓ Moderate flood exposure ✓ Existing urban connectivity ✓ Lower environmental constraint

[Highlight Candidate Areas] [Compare Areas] [Generate Report]

11. AI TOOL ARCHITECTURE (frontend service layer)

Create typed mock service functions — never hardcode logic inside React components:

getSiteSummary(siteId)
getChangeDetection(siteId)
getLandCover(siteId)
getLivabilityScore(siteId)
getSuitabilityScore(siteId)
getFloodRisk(siteId)
getAccessibility(siteId)
findHighRiskAreas()
findHighGrowthAreas()
findLowAccessibilityAreas()
compareSites(siteA, siteB)
highlightMap(features)
zoomMap(bounds)
toggleLayer(layerId)
setTimeComparison(t1, t2)
generateReport(siteId)
getIndicatorDefinition(indicatorId)


12. PROVIDER ABSTRACTION (Gemini-ready, never hardcoded)

Create GeminiProvider and MockAIProvider behind one interface. The UI must work fully with zero API key configured.

VITE_AI_PROVIDER=mock       # default, always works
VITE_AI_PROVIDER=gemini     # conceptually supported, wired later


Never expose a Gemini API key in frontend code. The intended real flow is Frontend → FastAPI backend → Gemini API. For this Lovable prototype, mock the backend responses where a real backend isn't available yet. Ship a .env.example.

13. CHANGE DETECTION (/change-detection)

Controls: Site selector, T1 (e.g. January 2023), T2 (e.g. January 2025), comparison mode (Side-by-side / Swipe / Overlay).

Main area: T1 image left, T2 image right (or one map with swipe). Change overlay: red = built-up increase, green = vegetation change, blue = water change, gray = no significant change.

Right panel — Change Summary: Built-up +18.6% · Vegetation −12.3% · Water +3.4% · Changed Area 256.4 ha · Confidence 87%, plus one AI explanation sentence (e.g. "Built-up expansion is concentrated around the eastern corridor.") and a [Highlight Built-up Growth] action.

14. LAND COVER

Categories: Built-up, Vegetation, Water, Bare Land. Show a donut chart with legend (e.g. Built-up 42% · Vegetation 38% · Water 11% · Bare Land 9%), a map overlay, and a temporal comparison. All values come from structured mock data files — never scattered magic numbers in components.

15. LIVABILITY INDEX (/livability) — the flagship page

Overall score: 84 / 100 — Good

Five weighted dimensions (match this exact breakdown):

Dimension Weight Example score Environmental Quality 25 pts 21 / 25 Mobility & Accessibility 25 pts 23 / 25 Safety & Resilience 20 pts 18 / 20 Community & Facilities 15 pts 13 / 15 Sustainability 15 pts 11 / 15

Visualize with a radial/radar chart, horizontal bars per dimension, a map heatmap overlay, and evidence cards. The score must be explainable — include a "Why 84?" panel:

+ Strong road accessibility
+ Moderate facility proximity
+ Good green coverage
− Moderate flood exposure
− Recent vegetation loss


with a [View Evidence] action.

16. ACCESSIBILITY

Indicators: road proximity, road connectivity, major road access, facility proximity (schools, healthcare), public transport where data exists. Example: Accessibility Score 91/100 · Road Access "Very Good" · Facility Access "Good" · Connectivity "Excellent". Map overlay: green = high accessibility, yellow = moderate, red = low.

17. FLOOD / RESILIENCE

Use careful language — never claim precise flood prediction the data doesn't support. Use: "Flood Exposure," "Resilience Indicator," "Indicative Risk," "Planner Review Required." Categories: Low / Moderate / High.

Example — Flood Exposure: Moderate, contributing factors: Water proximity (Medium) · Low-lying area (High) · Impervious surface (Medium) · Drainage proximity (Medium).

18. PLANNING / SUITABILITY (/planning)

Title: "Planning Suitability." Subtitle: "Indicative spatial screening for sustainable development." Suitability heatmap with categories: Highly Suitable / Suitable / Conditional / Low Suitability.

Example score: 82/100, from Accessibility (25%), Flood Resilience (25%), Environmental Compatibility (20%), Land Use Compatibility (15%), Infrastructure Proximity (15%) — display all weights transparently.

Mandatory disclaimer on this page: "Suitability results are indicative decision-support outputs and require professional planning review. This is not statutory planning approval."

19. PLANNING RECOMMENDATION

A recommendation panel with: headline recommendation sentence, an evidence checklist (✓), a constraints list (⚠), and 3–5 numbered suggested actions. Buttons: [Show Evidence] [Highlight Areas] [Generate Report].

20. REPORTS (/reports)

Report card: "Ginkgo Spatial Planning Assessment — Site A — Status: Ready." Sections: Executive Summary, Study Area, Temporal Change, Land Cover, Accessibility, Flood/Resilience, Sustainability, Livability Index, Development Suitability, AI Planning Recommendation, Risks & Constraints, Suggested Actions, Methodology, Data & Models, Disclaimer. Buttons: [Preview Report] [Export PDF] [Export JSON] [Export GeoJSON] — mock downloadable output or a report preview is fine for now.

21. DATA CATALOG (/data)

Columns: Dataset · Type · Location · Temporal Period · Status · Processing · Model · Updated. Example rows: Satellite T1 (Raster, Site A, 2023, Processed, Complete, Gemini Prototype), Satellite T2 (…2025…), Change Map (GeoJSON, Site A, 2023–2025, Generated, Complete, Mock Change Model). Clearly label everything "Prototype / Dummy Data" — never invent fake external sources.

22. SETTINGS (/settings)

Sections: Profile · AI Provider · Map Settings · Analysis Weights · Model Configuration · Feature Flags.

Show: AI Provider = Mock AI (options: Mock AI / Gemini) · Model A = "Not Connected" · Model B = "Not Connected". Feature flags: USE_GEMINI, USE_PERSON_A_MODEL, USE_PERSON_B_MODEL, USE_DUMMY_DATA.

23. HELP (/help)

Sections: What is Ginkgo? · How Ginkgo Works · Livability Index Methodology · Spatial Analysis Methodology · AI Copilot · Data Sources · Model Information · Limitations · Responsible AI · FAQ.

Mandatory disclaimer: "Ginkgo is a decision-support prototype. AI-generated insights and spatial suitability results should be reviewed by qualified planning professionals and should not be interpreted as statutory planning approval."

24. DATA ARCHITECTURE

Structured mock data files, never inline magic numbers:

src/data/sites.ts
src/data/analysis.ts
src/data/changeDetection.ts
src/data/livability.ts
src/data/suitability.ts
src/data/accessibility.ts
src/data/flood.ts
src/data/layers.ts


25. TYPESCRIPT TYPES

Site, SpatialMetric, ChangeDetectionResult, LandCoverResult, LivabilityResult, LivabilityDimension, AccessibilityResult, FloodRiskResult, SuitabilityResult, PlanningRecommendation, AIMessage, AIToolCall, MapFeature, MapAction, Report, Dataset, ModelStatus.

26. MAP STATE

Central state: selectedSite, activeLayers, visibleFeatures, mapBounds, zoom, center, timePeriod, highlightedFeatures, selectedFeature. The AI Copilot must be able to trigger highlightFeatures(), zoomToFeatures(), toggleLayer(), setTimeComparison(), selectSite() as real frontend state/events, not simulated text.

27. COMPONENT ARCHITECTURE

components/
  layout/
  map/       → MapCanvas, LayerControl, MapLegend, MapSearch, MapToolbar,
               MapComparison, MapSelectionCard, MapHighlight
  ai/        → AICopilot, AIMessage, AIToolAction, AISpatialEvidence, SuggestedPrompt
  charts/
  metrics/   → MetricCard, ScoreCard, LivabilityRadar, ProgressMetric,
               ChangeSummary, EvidenceCard
  planning/
  analysis/
  reports/
  data/
  ui/


28. DESIGN SYSTEM

Modern professional sans-serif, compact hierarchy: Page title → Section title → Metric → Body → Caption. Buttons: Primary / Secondary / Ghost / Danger. Cards: white, thin border, subtle shadow — not every element should be a floating card; the map should feel like one continuous workspace, not a card grid.

29–32. RESPONSIVENESS, MICROINTERACTIONS, STATES

Desktop-first, calibrate 1440 / 1280 / 1024px. Below that: collapse the AI panel and layers panel first, always preserve the map, make analytics scrollable.

Subtle animations only: AI-thinking status pulse, smooth map-highlight transitions, short layer-toggle fades, gentle card hover. Do not overanimate — professional product beats flashy demo.

Every analysis surface needs a loading state ("Running spatial analysis..."), an empty state ("Analysis not available yet."), and an honest error/fallback state ("Model unavailable — showing prototype result.").

33. MODEL INTEGRATION STRATEGY

Frontend
   ↓
API / Service Layer
   ↓
Analysis Adapter
   ↓
Model (Mock now → Gemini → Person A model → Person B model, later)


The frontend must never depend on a model-specific implementation. When Person A's or Person B's trained model is ready, only the adapter changes.

34. SECURITY RULE

Never put secret API keys in frontend source. Real Gemini calls always route Frontend → Backend → Gemini API via environment variables. Provide a .env.example.

35. TECH STACK

Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, MapLibre GL JS, Recharts. Prepared for (not built now): Python, FastAPI, Pydantic backend; GeoPandas, Rasterio, Shapely, GDAL, PostGIS for the real GIS layer. Do not add unnecessary technologies now.

36. MAKE IT FUNCTIONAL, NOT STATIC

Every one of these must actually work in the prototype: navigation, map selection, layer toggling, site selection, temporal comparison, metric updates, AI Copilot interaction, suggested prompts, map-highlight actions, livability calculation display, suitability display, report-generation flow, data-catalog filtering, settings, responsive layout. Where a real backend isn't available, build a clean mock service so the interaction still genuinely happens end-to-end in the UI.

37. GOLDEN DEMO FLOW (design every screen to support this exact path)

Dashboard → select Site A → satellite map loads → T1 vs T2 comparison →
click "Run Spatial Intelligence" → KPI strip populates (Built-up +18.6%,
Vegetation −12.3%, Flood Moderate, Accessibility 91/100, Livability 84/100)
→ open AI Copilot → ask "Where should we prioritize sustainable
residential development?" → AI reasons over the evidence → map highlights
candidate areas → AI explains accessibility / flood resilience /
environmental constraints / livability trade-offs → click
"Generate Planning Report" → report preview opens → final summary screen:
Ginkgo Spatial Planning Assessment — Site A — Livability 84/100 —
Suitability 82/100 — "Potentially suitable with environmental and
drainage considerations."


38. BUILD ORDER

Phase 1 — shell, navigation, Dashboard, map, dummy sites, layer system, KPI cards. Phase 2 — Analysis, Change Detection, Livability, Accessibility, Flood, Suitability. Phase 3 — AI Copilot, mock tool calling, map actions, spatial evidence. Phase 4 — Reports, Data catalog, Settings, Help. Phase 5 — backend-integration prep, Gemini-integration prep, Person A/B model adapters.

Build incrementally, but keep the Ginkgo design language cohesive at every stage.

39. DO NOT DO THESE THINGS

Do not: use a dark theme · build a generic admin dashboard · build a generic chatbot · put a tiny map inside a card · use meaningless decorative charts · hardcode AI responses inside components · fabricate "AI magic" · claim exact flood prediction the data can't support · claim legal/statutory planning approval · overuse gradients or rounded cards · leave huge empty spaces · over-animate · make every metric a giant vanity number · expose API keys · couple the frontend directly to Gemini · make Person A's or Person B's models mandatory for the app to function.

40. SUCCESS CRITERIA

The finished app should feel like CARTO + a Singapore-style planning GIS + Bloomberg Terminal + Apple + an AI spatial agent — but unmistakably its own, original Ginkgo design. On first glance, a user should think "this is a professional spatial intelligence system for urban planning," not "this is another AI dashboard."

41. START NOW

Do not ask unnecessary clarification questions. Make reasonable implementation decisions and build incrementally, keeping the entire experience cohesive at every stage. Prioritize: (1) visual quality, (2) map-first experience, (3) functional interactions, (4) AI-to-map interaction, (5) clean component architecture, (6) mock-data abstraction, (7) future Gemini integration, (8) future Person A/B model integration.

BEGIN BUILDING GINKGO NOW.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c663f325-46a4-475f-88bf-9e1748453541).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
