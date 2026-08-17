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
- **Typography**: Clean sans-serif (**Inter** from Google Fonts) as primary font; tabular numbers for metrics.
- **Chroma Role**: Pure monochrome UI chrome. Color is reserved strictly for functional data severity indicators (Emerald `#10B981`, Amber `#F59E0B`, Coral Red `#EF4444`, Sky Blue `#38BDF8`). **No purple or violet on UI chrome.**
- **Active State Tokens**: High-contrast crisp white background with `#090A0C` text or white/10 hover states.
- **Dashboard Layout**: Split-screen mission-control layout: 62% Left Canvas (Interactive Satellite Map / Draggable Dual-View Slider) and 38% Right Intelligence Panel (Livability Quadrants, Priority Hotspots Alert Feed, Scenario Simulator, Statutory Reports).

---

## 3. Production Architecture & Data Standards

- **Unified Backend Structure (`backend/`)**: All models, samples, feature extraction, and prediction endpoints reside directly within the root `backend/` directory without external dependencies on temporary teammate folders.
- **Multi-Model Support**: Support Nadi's Hydrological Flood Engine (RF, DT, HGB), Tisya's Multi-Spectral Temporal differencing, and the PyTorch Siamese U-Net 5-Class Land Cover Classifier.
- **Authentic Satellite Imagery**: Maintain high-resolution Sentinel-2 and Esri World Imagery tile composites; avoid static stock photo placeholders.
- **Machine Learning Adapters**: Analytical reads and ML inferences route through `src/services/spatial.ts` with instant fallback to on-device simulations if external API connection drops.
