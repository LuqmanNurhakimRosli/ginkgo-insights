import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Braces, Download, Printer } from "lucide-react";
import { AnalysisGate } from "@/components/analysis/AnalysisGate";
import { GinkgoMap } from "@/components/map/GinkgoMap";
import { btn, Page, PageHeader } from "@/components/gk/ui";
import { download, fileBase, reportId, toGeoJson, toJson } from "@/lib/geo/export";
import { formatArea, formatDistance, formatLatLng, round, bboxCenter } from "@/lib/geo/math";
import { osmHost } from "@/lib/geo/osm";
import { recommendations } from "@/lib/geo/recommend";
import { LAND_LABELS } from "@/lib/geo/render";
import { useGinkgo } from "@/state/ginkgo-store";
import { LandClass, type AreaAnalysis } from "@/types/geo";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Planning report — Ginkgo" },
      {
        name: "description",
        content:
          "Printable riverine flood and development screening report with JSON and GeoJSON exports.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { analysis } = useGinkgo();
  return (
    <Page
      header={
        <PageHeader
          title="Planning report"
          description="Every figure in this document is computed by the GIS engine and matches what you see on the map."
          actions={
            analysis ? (
              <>
                <button
                  onClick={() =>
                    download(`${fileBase(analysis)}.json`, toJson(analysis), "application/json")
                  }
                  className={btn.secondary}
                >
                  <Braces className="h-3.5 w-3.5" /> JSON
                </button>
                <button
                  onClick={() =>
                    download(
                      `${fileBase(analysis)}.geojson`,
                      toGeoJson(analysis),
                      "application/geo+json",
                    )
                  }
                  className={btn.secondary}
                >
                  <Download className="h-3.5 w-3.5" /> GeoJSON
                </button>
                <button onClick={() => window.print()} className={btn.primary}>
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
              </>
            ) : undefined
          }
        />
      }
    >
      <AnalysisGate what="The planning report">{(a) => <ReportDoc a={a} />}</AnalysisGate>
    </Page>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="print-keep space-y-2.5">
      <h2 className="flex items-baseline gap-2 border-b border-white/10 pb-1.5 text-[14px] font-semibold">
        <span className="num text-[#64748b]">{n}.</span> {title}
      </h2>
      {children}
    </section>
  );
}

function KV({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <table className="w-full text-[12px]">
      <tbody className="divide-y divide-white/[0.06]">
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="w-[45%] py-1.5 pr-3 text-[#94a3b8]">{k}</td>
            <td className="num py-1.5">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReportDoc({ a }: { a: AreaAnalysis }) {
  const f = a.flood;
  const p = f.peak;
  const recs = recommendations(a);
  const pct = (v: number) => `${round(v, 1)}%`;
  const date = new Date(a.computedAt).toLocaleString("en-MY", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return (
    <div className="p-3 sm:p-6">
      <article className="print-doc mx-auto max-w-[860px] space-y-6 rounded-xl border border-white/[0.08] bg-[#14161b] p-5 sm:p-8">
        <header className="print-keep space-y-3 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94a3b8]">
            <span className="font-mono">{reportId(a)}</span>
            <span>{date}</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
              Ginkgo · Riverine flood &amp; development screening
            </div>
            <h1 className="mt-1 text-[24px] font-semibold tracking-tight">{a.aoi.name}</h1>
            <div className="text-[13px] text-[#cbd5e1]">
              {[a.aoi.locality, formatArea(a.areaKm2), formatLatLng(bboxCenter(a.aoi.bbox), 4)]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Riverine flood", f.areaClass],
              ["High-susceptibility cells", pct(f.shares.High * 100)],
              ["Livability", `${a.scores.livability.score}/100 (${a.scores.livability.band})`],
              ["Screening", `${a.scores.suitability.score}/100 · ${a.scores.suitability.cls}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/[0.08] px-3 py-2">
                <div className="text-[10.5px] text-[#94a3b8]">{k}</div>
                <div className="num mt-0.5 text-[13px] font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </header>

        <div className="print-keep overflow-hidden rounded-lg border border-white/[0.08]">
          <div className="h-[300px]">
            <GinkgoMap variant="inset" />
          </div>
          <div className="border-t border-white/[0.08] px-3 py-1.5 text-[10.5px] text-[#94a3b8]">
            Area outline with riverine susceptibility overlay (red High · amber Moderate · green
            Low) and OpenStreetMap waterways.
          </div>
        </div>

        <Section n={1} title="Planning conditions">
          <ol className="space-y-2 text-[12.5px]">
            {recs.map((r, i) => (
              <li key={r.id} className="print-keep">
                <span className="font-semibold">
                  {i + 1}. {r.title}
                </span>{" "}
                <span className="text-[10.5px] uppercase text-[#94a3b8]">({r.priority})</span>
                <div className="text-[#cbd5e1]">{r.detail}</div>
                <div className="text-[11.5px] text-[#94a3b8]">Basis: {r.basis}</div>
              </li>
            ))}
          </ol>
        </Section>

        <Section n={2} title="Riverine (fluvial) flood susceptibility">
          <KV
            rows={[
              ["Area class", f.areaClass],
              [
                "High / Moderate / Low cells",
                `${pct(f.shares.High * 100)} / ${pct(f.shares.Moderate * 100)} / ${pct(f.shares.Low * 100)}`,
              ],
              ["Mean / P90 index", `${f.meanIndex.toFixed(2)} / ${f.p90Index.toFixed(2)}`],
              ["Within 50 m of river/canal", pct(f.riverReserveSharePct)],
              ["Channels considered", f.channelNames.join(", ") || `${f.channelCount} unnamed`],
            ]}
          />
          {p && (
            <>
              <div className="pt-1 text-[12px] font-medium">
                Most susceptible cell — computed inputs
              </div>
              <KV
                rows={[
                  ["Location", formatLatLng([p.lat, p.lng], 5)],
                  [
                    "Distance to channel",
                    `${formatDistance(p.distanceM)}${p.channelName ? ` (${p.channelName})` : ""}`,
                  ],
                  [
                    "Ground / river elevation",
                    `${p.elevationM.toFixed(1)} m / ${p.channelElevationM.toFixed(1)} m`,
                  ],
                  ["Height above river (HAND)", `${p.handM.toFixed(1)} m`],
                  ["Slope", `${p.slopeDeg.toFixed(1)}°`],
                  [
                    "Factors (distance · HAND · flatness)",
                    `${p.fDistance.toFixed(2)} · ${p.fHand.toFixed(2)} · ${p.fSlope.toFixed(2)}`,
                  ],
                  ["RFSI", `${p.index.toFixed(2)} (${p.cls})`],
                ]}
              />
            </>
          )}
          <p className="text-[11.5px] leading-relaxed text-[#94a3b8]">
            RFSI = Σ w·F ÷ Σ w with F_dist = 0.5^(d ÷ {a.params.distanceHalfM} m), F_hand = 0.5^(h ÷{" "}
            {a.params.handHalfM} m), F_flat = 1 − min(slope ÷ {a.params.slopeZeroDeg}°, 1); weights{" "}
            {f.weightsUsed.distance} / {f.weightsUsed.hand} / {f.weightsUsed.slope}. High ≥{" "}
            {a.params.highAt}, Moderate ≥ {a.params.moderateAt}. Historical flood evidence not
            included: {f.termsMissing[0]?.reason}
          </p>
        </Section>

        <Section n={3} title="Land use and built form">
          <KV
            rows={[
              ...[
                LandClass.BuiltUp,
                LandClass.Vegetation,
                LandClass.Water,
                LandClass.Agriculture,
                LandClass.Bare,
                LandClass.Unmapped,
              ].map((c) => [LAND_LABELS[c], pct(a.landCover.shares[c])] as [string, string]),
              [
                "Buildings (OSM footprints)",
                `${a.landCover.buildingCount.toLocaleString()}${a.landCover.buildingsTruncated ? " (truncated)" : ""}`,
              ],
              ["Footprint coverage", pct(a.landCover.footprintCoveragePct)],
            ]}
          />
        </Section>

        <Section n={4} title="Access and terrain">
          <KV
            rows={[
              ["Accessibility score", `${a.access.score}/100`],
              [
                "Roads in area",
                `${round(a.access.roadKm, 1)} km (${round(a.access.roadDensity, 1)} km/km²)`,
              ],
              [
                "Nearest arterial",
                a.access.majorRoadDistanceM == null
                  ? "None within 1 km"
                  : `${formatDistance(a.access.majorRoadDistanceM)}${a.access.majorRoadName ? ` — ${a.access.majorRoadName}` : ""}`,
              ],
              [
                "Transit stops within 1 km",
                `${a.access.transitStops} (${a.access.railStations} rail)`,
              ],
              ["Education / health within 1 km", `${a.access.education} / ${a.access.health}`],
              ["Ground elevation", `${a.terrain.minM.toFixed(0)}–${a.terrain.maxM.toFixed(0)} m`],
              [
                "Slope classes I / II / III / IV",
                `${pct(a.terrain.slopeClassPct.I)} / ${pct(a.terrain.slopeClassPct.II)} / ${pct(a.terrain.slopeClassPct.III)} / ${pct(a.terrain.slopeClassPct.IV)}`,
              ],
            ]}
          />
        </Section>

        <Section n={5} title="Livability index">
          <KV
            rows={[
              ...a.scores.livability.dims.map(
                (d) =>
                  [`${d.label} (weight ${d.weight})`, `${d.score}/100 — ${d.inputs}`] as [
                    string,
                    string,
                  ],
              ),
              ["Index", `${a.scores.livability.score}/100 (${a.scores.livability.band})`],
            ]}
          />
        </Section>

        <Section n={6} title="Development suitability screening">
          <KV
            rows={[
              ...a.scores.suitability.criteria.map(
                (c) => [`${c.label} (weight ${c.weight})`, `${c.score}/100`] as [string, string],
              ),
              ["Weighted score", `${a.scores.suitability.score}/100`],
              ["Outcome", a.scores.suitability.cls],
            ]}
          />
          <div className="space-y-1 pt-1">
            {a.scores.suitability.flags.map((fl) => (
              <div key={fl.id} className="text-[12px]">
                <span className="font-semibold uppercase">[{fl.status}]</span> {fl.label}:{" "}
                {fl.value}
                <span className="text-[#94a3b8]"> — {fl.reference}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section n={7} title="Data sources, method and limitations">
          <ul className="list-disc space-y-1 pl-5 text-[12px] text-[#cbd5e1]">
            <li>
              Elevation: {a.terrain.demSource}, sampled at zoom {a.terrain.demZoom}; ground surface
              = 20th percentile in a ~90 m window to suppress rooftops.
            </li>
            <li>
              Rivers, land use, buildings, roads and facilities: © OpenStreetMap contributors
              (ODbL), via {osmHost(a.osm.endpoint)}, retrieved{" "}
              {new Date(a.osm.fetchedAt).toLocaleString("en-MY")}.
            </li>
            <li>
              Analysis grid {a.grid.rows} × {a.grid.cols} cells at ~{Math.round(a.grid.cellW)} m;
              catchment buffer 1 km for rivers, roads and facilities.
            </li>
            <li>
              Model parameters are illustrative and literature-anchored; they have not been
              calibrated against observed JPS flood extents.
            </li>
            <li>
              Riverine scope only — flash floods from drainage capacity are not modelled. OSM
              completeness varies by area.
            </li>
            {a.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className="rounded-lg border border-white/[0.08] p-3 text-[11.5px] text-[#94a3b8]">
            This report is screening-level decision support for planning authorities. It is not a
            statutory planning approval, a hydraulic flood study or a substitute for site
            investigation. No score in this document was produced by a language model.
          </p>
        </Section>
      </article>
    </div>
  );
}
