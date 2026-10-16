import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FlaskConical, Play, XCircle } from "lucide-react";
import { btn, Page, PageHeader, Panel, PanelHeader, RiskBadge, Spinner } from "@/components/gk/ui";
import { getPreset, presetToAoi } from "@/data/presets";
import { inspectPoint } from "@/lib/geo/analyze";
import { fDistance, fFlat, fHand } from "@/lib/geo/flood";
import { formatDistance } from "@/lib/geo/math";
import { analyze } from "@/services/spatial";
import { useGinkgo } from "@/state/ginkgo-store";
import type { CellInspection, FloodParams } from "@/types/geo";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Methodology — Ginkgo" },
      {
        name: "description",
        content:
          "How Ginkgo computes riverine flood susceptibility, livability and suitability — formulas, data, validation and where AI is used.",
      },
    ],
  }),
  component: MethodPage,
});

// ─── Sensitivity curve (single series, hover crosshair) ─────────────────────
function Curve({
  title,
  unit,
  max,
  fn,
  marker,
}: {
  title: string;
  unit: string;
  max: number;
  fn: (x: number) => number;
  marker: { x: number; label: string };
}) {
  const W = 300;
  const H = 150;
  const P = { l: 30, r: 10, t: 10, b: 24 };
  const pts = useMemo(
    () => Array.from({ length: 121 }, (_, i) => (i / 120) * max).map((x) => [x, fn(x)] as const),
    [fn, max],
  );
  const sx = (x: number) => P.l + (x / max) * (W - P.l - P.r);
  const sy = (y: number) => P.t + (1 - y) * (H - P.t - P.b);
  const [hover, setHover] = useState<number | null>(null);
  const hx = hover == null ? null : hover;
  return (
    <figure className="rounded-xl border border-white/[0.08] bg-[#0f1115] p-3">
      <figcaption className="mb-1 text-[12px] font-medium">{title}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={`${title}: factor from 1 at 0 ${unit} down towards 0 at ${max} ${unit}`}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = (((e.clientX - r.left) / r.width) * W - P.l) / (W - P.l - P.r);
          setHover(Math.min(max, Math.max(0, x * max)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={P.l} x2={W - P.r} y1={sy(y)} y2={sy(y)} stroke="rgba(255,255,255,0.08)" />
            <text x={P.l - 6} y={sy(y) + 3} textAnchor="end" fontSize="9" fill="#64748b">
              {y}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((t) => (
          <text key={t} x={sx(t * max)} y={H - 8} textAnchor="middle" fontSize="9" fill="#64748b">
            {Math.round(t * max)}
            {unit}
          </text>
        ))}
        <line
          x1={sx(marker.x)}
          x2={sx(marker.x)}
          y1={P.t}
          y2={H - P.b}
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="3 3"
        />
        <text x={sx(marker.x) + 4} y={P.t + 9} fontSize="9" fill="#94a3b8">
          {marker.label}
        </text>
        <polyline
          points={pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {hx != null && (
          <g>
            <line x1={sx(hx)} x2={sx(hx)} y1={P.t} y2={H - P.b} stroke="rgba(255,255,255,0.4)" />
            <circle
              cx={sx(hx)}
              cy={sy(fn(hx))}
              r="4"
              fill="#fff"
              stroke="#0f1115"
              strokeWidth="2"
            />
            <g
              transform={`translate(${Math.min(sx(hx) + 8, W - 92)},${Math.max(sy(fn(hx)) - 30, 4)})`}
            >
              <rect width="84" height="24" rx="5" fill="#1e2129" stroke="rgba(255,255,255,0.12)" />
              <text x="8" y="16" fontSize="10" fill="#fff">
                {hx.toFixed(hx < 10 ? 1 : 0)}
                {unit} → {fn(hx).toFixed(2)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </figure>
  );
}

// ─── Live validation ────────────────────────────────────────────────────────
const VALIDATION = [
  {
    name: "Masjid Jamek (Klang–Gombak confluence)",
    lat: 3.14907,
    lng: 101.69564,
    expect: ["High"],
  },
  { name: "Dataran Merdeka", lat: 3.14779, lng: 101.6935, expect: ["High", "Moderate"] },
  { name: "Bukit Nanas (forest hill)", lat: 3.15212, lng: 101.70316, expect: ["Low"] },
  { name: "KL Tower (hilltop)", lat: 3.15284, lng: 101.70386, expect: ["Low"] },
];

function Validation({ params }: { params: FloodParams }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [rows, setRows] = useState<
    Array<{ name: string; expect: string[]; cell: CellInspection | null }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setState("running");
    setError(null);
    try {
      const a = await analyze(presetToAoi(getPreset("kl-confluence")!), { params });
      setRows(
        VALIDATION.map((v) => ({
          name: v.name,
          expect: v.expect,
          cell: inspectPoint(a, v.lat, v.lng),
        })),
      );
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  };
  const pass = rows.length > 0 && rows.every((r) => r.cell && r.expect.includes(r.cell.cls));
  return (
    <Panel>
      <PanelHeader
        title="Riverine gate test — Masjid Jamek vs Bukit Nanas"
        icon={<FlaskConical className="h-4 w-4" />}
        hint="Runs the full pipeline on live SRTM + OpenStreetMap data with the current model settings. Expected: river confluence High, nearby hill Low."
        action={
          <button onClick={() => void run()} disabled={state === "running"} className={btn.primary}>
            {state === "running" ? <Spinner /> : <Play className="h-3.5 w-3.5" />}{" "}
            {state === "done" ? "Run again" : "Run test"}
          </button>
        }
      />
      <div className="p-4">
        {state === "idle" && (
          <p className="text-[12px] text-[#94a3b8]">Not run in this session yet.</p>
        )}
        {state === "error" && <p className="text-[12px] text-[#fca5a5]">Could not run: {error}</p>}
        {state === "done" && (
          <div className="space-y-3 animate-fade-in">
            <div
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: pass ? "#10B981" : "#EF4444" }}
            >
              {pass ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              Gate {pass ? "passed" : "failed"} — recorded {new Date().toLocaleString("en-MY")}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[12px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="py-2 pr-2 font-semibold">Location</th>
                    <th className="px-2 py-2 font-semibold">Result</th>
                    <th className="px-2 py-2 text-right font-semibold">RFSI</th>
                    <th className="px-2 py-2 text-right font-semibold">HAND</th>
                    <th className="px-2 py-2 text-right font-semibold">To river</th>
                    <th className="px-2 py-2 text-right font-semibold">Slope</th>
                    <th className="py-2 pl-2 font-semibold">Expected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {rows.map((r) => (
                    <tr key={r.name}>
                      <td className="py-2 pr-2">{r.name}</td>
                      <td className="px-2 py-2">{r.cell ? <RiskBadge cls={r.cell.cls} /> : "—"}</td>
                      <td className="num px-2 py-2 text-right">{r.cell?.index.toFixed(2)}</td>
                      <td className="num px-2 py-2 text-right">
                        {r.cell && Number.isFinite(r.cell.handM)
                          ? `${r.cell.handM.toFixed(1)} m`
                          : "—"}
                      </td>
                      <td className="num px-2 py-2 text-right">
                        {r.cell ? formatDistance(r.cell.distanceM) : "—"}
                      </td>
                      <td className="num px-2 py-2 text-right">
                        {r.cell ? `${r.cell.slopeDeg.toFixed(1)}°` : "—"}
                      </td>
                      <td className="py-2 pl-2 text-[#94a3b8]">
                        {r.cell && r.expect.includes(r.cell.cls) ? "✓ " : "✗ "}
                        {r.expect.join(" / ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-[#64748b]">
          Development record (real SRTM, hand-digitised approximation of the Klang/Gombak
          centrelines because OpenStreetMap was not reachable from the build environment): Masjid
          Jamek 0.65 High · Dataran Merdeka 0.80 High · Bukit Nanas 0.15 Low · KL Tower 0.16 Low.
          The live run above uses actual OSM river geometry and is the result to cite.
        </p>
      </div>
    </Panel>
  );
}

const AI_TABLE = [
  [
    "Elevation, slope, height above river",
    "SRTM DEM · percentile ground filter · finite differences",
    "No — deterministic GIS",
  ],
  ["River proximity", "OSM waterways · nearest-channel search", "No"],
  ["Riverine flood index", "Weighted formula (below)", "No"],
  ["Land use, buildings, access", "OSM tag rasterisation · road and facility counts", "No"],
  ["Livability & suitability", "Published weighted formulas · screening rules", "No"],
  ["Imagery change (in-app)", "VARI visible-band index difference", "No — image arithmetic"],
  [
    "Imagery models (optional backend)",
    "PyTorch Siamese U-Net change detection · Random Forest land cover",
    "Yes — machine learning on imagery",
  ],
  [
    "Copilot",
    "LLM narrates the computed JSON; on-device analyst by default",
    "Yes — language only, never produces scores",
  ],
];

function MethodPage() {
  const { settings } = useGinkgo();
  const p = settings.floodParams;
  const wSum = p.weights.distance + p.weights.hand + p.weights.slope || 1;
  return (
    <Page
      header={
        <PageHeader
          title="Methodology"
          description="What Ginkgo computes, from which data, and exactly where AI is (and is not) used."
        />
      }
    >
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <Panel>
          <PanelHeader
            title="Pipeline"
            hint="Runs in the browser for any area you draw; nothing is pre-computed."
          />
          <ol className="grid gap-px overflow-hidden rounded-b-xl bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "1 · Select",
                "Search, draw a rectangle, import a boundary or use the current view (150 m – 10 km).",
              ],
              [
                "2 · Fetch",
                "SRTM elevation tiles + OpenStreetMap rivers, land use, buildings, roads and facilities (area + 1 km buffer).",
              ],
              [
                "3 · Compute",
                "Ground surface, slope, nearest river, height above river, flood index, land-use grid, access indicators.",
              ],
              [
                "4 · Explain",
                "Scores, screening flags, rule-based planning conditions, 'why this score' per cell, report and exports.",
              ],
            ].map(([t, d]) => (
              <li key={t} className="bg-[#14161b] p-4">
                <div className="text-[12.5px] font-semibold">{t}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-[#94a3b8]">{d}</div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel>
          <PanelHeader
            title="Riverine (fluvial) flood susceptibility index — RFSI"
            hint="Scope: river overflow only. Pluvial / flash flooding from drainage capacity is not modelled."
          />
          <div className="space-y-4 p-4">
            <pre className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#0f1115] p-3 font-mono text-[12px] leading-relaxed text-[#e2e8f0]">
              {`RFSI = ${(p.weights.distance / wSum).toFixed(2)}·F_dist + ${(p.weights.hand / wSum).toFixed(2)}·F_hand + ${(p.weights.slope / wSum).toFixed(2)}·F_flat
F_dist = 0.5^(d / ${p.distanceHalfM} m)      d = distance to nearest river/canal (streams ×2, drains ×4)
F_hand = 0.5^(h / ${p.handHalfM} m)        h = ground − river ground elevation (≥ 0)
F_flat = 1 − min(slope / ${p.slopeZeroDeg}°, 1)
High ≥ ${p.highAt} · Moderate ≥ ${p.moderateAt} · Area class: High if ≥ 20 % High cells`}
            </pre>
            <div className="grid gap-3 md:grid-cols-3">
              <Curve
                title="Distance factor F_dist"
                unit=" m"
                max={1000}
                fn={(x) => fDistance(x, p)}
                marker={{ x: p.distanceHalfM, label: "d½" }}
              />
              <Curve
                title="Height factor F_hand"
                unit=" m"
                max={30}
                fn={(x) => fHand(x, p)}
                marker={{ x: p.handHalfM, label: "h½" }}
              />
              <Curve
                title="Flatness factor F_flat"
                unit="°"
                max={30}
                fn={(x) => fFlat(x, p)}
                marker={{ x: p.slopeZeroDeg, label: "zero" }}
              />
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-[#cbd5e1]">
              <li>
                <b>Monotonic by construction</b> — moving away from the river, rising above it or
                getting steeper can only lower the index (unit-tested sensitivity sweeps).
              </li>
              <li>
                <b>Flat-area safeguard</b> — flatness carries{" "}
                {Math.round((p.weights.slope / wSum) * 100)}% of the weight, so flat land far from
                any river stays Low. The earlier prototype inferred elevation from image brightness,
                which made flat bright areas read as high risk.
              </li>
              <li>
                <b>Rooftop filter</b> — SRTM is a surface model. Ground elevation is the 20th
                percentile of a ~90 m window, applied identically to cells and to the river
                reference so height-above-river compares like with like.
              </li>
              <li>
                <b>Missing term</b> — historical flood evidence (w₄) is excluded until verified
                JPS/DID flood extents are connected; its weight is redistributed and the gap is
                shown on every result.
              </li>
              <li>
                <b>Calibration</b> — parameters are anchored to published thresholds (HAND &lt; 5 m
                floodplain class, Nobre et al. 2011; 15° hill-site Class I) and are illustrative
                until calibrated against observed flood extents. Adjust them in{" "}
                <Link to="/settings" className="text-white underline underline-offset-2">
                  Settings
                </Link>
                .
              </li>
            </ul>
          </div>
        </Panel>

        <Validation params={p} />

        <Panel>
          <PanelHeader
            title="Where AI is used"
            hint="Calculation and explanation are separate. No score is generated by a language model."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead className="text-[10.5px] uppercase tracking-wider text-[#64748b]">
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 font-semibold">Step</th>
                  <th className="px-2 py-2.5 font-semibold">Technique</th>
                  <th className="px-4 py-2.5 font-semibold">AI / ML?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {AI_TABLE.map(([step, tech, ai]) => (
                  <tr key={step}>
                    <td className="px-4 py-2.5 font-medium">{step}</td>
                    <td className="px-2 py-2.5 text-[#cbd5e1]">{tech}</td>
                    <td className="px-4 py-2.5 text-[#94a3b8]">{ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelHeader title="Livability index" />
            <ul className="space-y-1.5 p-4 font-mono text-[11.5px] leading-relaxed text-[#cbd5e1]">
              <li>Environment = min(green ÷ 30 %, 1) × 100</li>
              <li>Mobility = 0.4 road density + 0.3 arterial + 0.3 transit</li>
              <li>Resilience = 100 × (1 − (High + ½ Moderate))</li>
              <li>Community = 50·min(schools÷4,1) + 50·min(health÷3,1)</li>
              <li>Mix = Shannon entropy of land classes ÷ ln 5</li>
              <li className="font-sans text-[#94a3b8]">
                Weighted 25 / 25 / 20 / 15 / 15 by default.
              </li>
            </ul>
          </Panel>
          <Panel>
            <PanelHeader title="Development suitability" />
            <ul className="space-y-1.5 p-4 text-[12px] leading-relaxed text-[#cbd5e1]">
              <li>
                Weighted criteria: accessibility, flood resilience, terrain (slope classes),
                environmental compatibility, services.
              </li>
              <li>
                Screening flags: 50 m river corridor, High flood share, slopes &gt; 25°, 10 % open
                space, OSM completeness.
              </li>
              <li>
                Any failed flag caps the outcome at Conditional regardless of the weighted score.
              </li>
              <li className="text-[#94a3b8]">
                Decision support for planning authorities — not statutory approval.
              </li>
            </ul>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Known limitations" />
          <ul className="list-disc space-y-1.5 p-4 pl-8 text-[12px] leading-relaxed text-[#cbd5e1]">
            <li>
              SRTM (2000, ~30 m) predates recent earthworks and smooths narrow channels; a
              JUPEM/LiDAR DTM would sharpen urban results.
            </li>
            <li>
              Height above river uses the nearest channel in plan, not a hydrologically routed flow
              path.
            </li>
            <li>
              OpenStreetMap coverage varies; unmapped land-use cells are reported, never guessed.
            </li>
            <li>
              Analyses are limited to 10 km per side to stay responsive in the browser and polite to
              public data services.
            </li>
          </ul>
        </Panel>
      </div>
    </Page>
  );
}
