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

Verification: `tsgo --noEmit` clean; all routes render with no horizontal scrollbar,
no text overflow and no console errors at 100% zoom.
