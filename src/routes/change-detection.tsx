import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Info, Leaf, Play } from "lucide-react";
import { CompareMap } from "@/components/map/CompareMap";
import { Bar, btn, Panel, PanelHeader, Segmented, Spinner, Stat, Switch } from "@/components/gk/ui";
import {
  S2_YEARS,
  toWaybackRelease,
  WAYBACK_CONFIG_URL,
  WAYBACK_FALLBACK,
  type ImageryRelease,
} from "@/data/basemaps";
import { vegetationChange, type VegChangeResult } from "@/lib/geo/imageryChange";
import { bboxSizeM, round } from "@/lib/geo/math";
import { useGinkgo } from "@/state/ginkgo-store";

export const Route = createFileRoute("/change-detection")({
  head: () => ({
    meta: [
      { title: "Imagery change — Ginkgo" },
      {
        name: "description",
        content:
          "Swipe between dated satellite imagery and measure visible-band vegetation change for an area.",
      },
    ],
  }),
  component: ChangePage,
});

type Source = "wayback" | "s2";

function useWaybackReleases() {
  const [list, setList] = useState<ImageryRelease[]>(() =>
    WAYBACK_FALLBACK.map(toWaybackRelease).reverse(),
  );
  const [live, setLive] = useState(false);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(WAYBACK_CONFIG_URL, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((cfg: Record<string, { itemTitle: string }>) => {
        const rows = Object.entries(cfg)
          .map(
            ([id, v]) =>
              [v.itemTitle.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? "", Number(id)] as [string, number],
          )
          .filter(([d]) => d)
          .sort((a, b) => (a[0] < b[0] ? 1 : -1));
        if (rows.length) {
          setList(rows.map(toWaybackRelease));
          setLive(true);
        }
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);
  return { list, live };
}

function ChangePage() {
  const { analysis } = useGinkgo();
  const wayback = useWaybackReleases();
  const [source, setSource] = useState<Source>("wayback");
  const releases = source === "wayback" ? wayback.list : [...S2_YEARS].reverse();
  const [beforeId, setBeforeId] = useState<string>("");
  const [afterId, setAfterId] = useState<string>("");
  const [result, setResult] = useState<VegChangeResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Defaults: oldest-ish vs newest available.
    const newest = releases[0];
    const older =
      source === "wayback"
        ? (releases.find((r) => r.date.startsWith("2016")) ?? releases[releases.length - 1])
        : releases.find((r) => r.date === "2018");
    setAfterId(newest?.id ?? "");
    setBeforeId(older?.id ?? releases[releases.length - 1]?.id ?? "");
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, wayback.live]);

  const before = releases.find((r) => r.id === beforeId) ?? releases[releases.length - 1]!;
  const after = releases.find((r) => r.id === afterId) ?? releases[0]!;
  const bbox = analysis?.aoi.bbox ?? null;

  useEffect(() => setResult(null), [beforeId, afterId, bbox]);

  const run = async () => {
    if (!bbox) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunning(true);
    setError(null);
    try {
      setResult(await vegetationChange(before, after, bbox, ctrl.signal));
    } catch (err) {
      if (!ctrl.signal.aborted) setError((err as Error).message);
    } finally {
      if (!ctrl.signal.aborted) setRunning(false);
    }
  };

  const overlay = useMemo(
    () => (result && bbox && showOverlay ? { image: result.image, bbox, opacity: 0.85 } : null),
    [result, bbox, showOverlay],
  );
  const tooBig = bbox ? Math.max(bboxSizeM(bbox).width, bboxSizeM(bbox).height) > 6000 : false;

  return (
    <div className="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <div className="relative h-[52vh] shrink-0 lg:h-full lg:min-w-0 lg:flex-1">
        {before && after && (
          <CompareMap before={before} after={after} bbox={bbox} overlay={overlay} />
        )}
      </div>
      <aside className="w-full shrink-0 space-y-4 border-white/[0.08] p-4 lg:h-full lg:w-[380px] lg:overflow-y-auto lg:border-l scroll-thin">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight">Imagery change</h1>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#94a3b8]">
            Drag the handle to compare dated imagery{analysis ? ` over ${analysis.aoi.name}` : ""}.
            Measure vegetation change inside the analysed area.
          </p>
        </div>

        <Segmented<Source>
          className="w-full [&>button]:flex-1"
          value={source}
          onChange={setSource}
          options={[
            {
              value: "wayback",
              label: "High-res (Esri Wayback)",
              title: "Esri World Imagery Wayback releases since 2014",
            },
            {
              value: "s2",
              label: "Sentinel-2 annual",
              title: "EOX Sentinel-2 cloudless yearly mosaics, 10 m",
            },
          ]}
        />

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["Before", beforeId, setBeforeId],
              ["After", afterId, setAfterId],
            ] as const
          ).map(([label, value, set]) => (
            <label key={label} className="block">
              <span className="mb-1 block text-[11px] text-[#94a3b8]">{label}</span>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0f1115] px-2 py-2 text-[12.5px] text-white outline-none"
              >
                {releases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.date}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className="text-[10.5px] text-[#64748b]">
          {source === "wayback"
            ? `${wayback.list.length} Wayback releases${wayback.live ? " (live list)" : " (offline list)"}. A release shows the newest imagery available at that date, so neighbouring releases can be identical where the area was not re-imaged.`
            : "EOX Sentinel-2 cloudless annual mosaics (10 m). 2016 CC BY 4.0; 2018+ CC BY-NC-SA 4.0."}
        </p>

        <Panel>
          <PanelHeader
            title="Vegetation change"
            icon={<Leaf className="h-4 w-4" />}
            hint="Visible-band index (VARI) within the analysed area."
          />
          <div className="space-y-3 p-4">
            {!bbox ? (
              <div className="text-[12px] leading-relaxed text-[#94a3b8]">
                Analyse an area on the{" "}
                <Link to="/" className="text-white underline underline-offset-2">
                  map
                </Link>{" "}
                to measure change inside it. You can still swipe imagery anywhere.
              </div>
            ) : (
              <>
                <button
                  onClick={() => void run()}
                  disabled={running || tooBig || before.id === after.id}
                  className={`${btn.primary} w-full`}
                >
                  {running ? <Spinner /> : <Play className="h-3.5 w-3.5" />}
                  {running ? "Reading imagery pixels…" : "Compute change"}
                </button>
                {tooBig && (
                  <p className="text-[11.5px] text-[#f59e0b]">
                    Area is larger than 6 km — draw a smaller area for pixel comparison.
                  </p>
                )}
                {before.id === after.id && (
                  <p className="text-[11.5px] text-[#94a3b8]">Choose two different dates.</p>
                )}
                {error && (
                  <div className="flex gap-2 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/[0.07] p-2.5 text-[11.5px] leading-snug text-[#fcd34d]">
                    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                    <span>
                      {error} Visual comparison still works; try the other imagery source for
                      statistics.
                    </span>
                  </div>
                )}
                {result && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <Stat
                        label={`Vegetation ${before.date}`}
                        value={round(result.vegBeforePct, 1)}
                        unit="%"
                      />
                      <Stat
                        label={`Vegetation ${after.date}`}
                        value={round(result.vegAfterPct, 1)}
                        unit="%"
                      />
                    </div>
                    {(
                      [
                        ["Vegetation loss", result.lossPct, "#EF4444"],
                        ["Vegetation gain", result.gainPct, "#10B981"],
                        [
                          "Brightening (possible clearing / new hard surface)",
                          result.brightenPct,
                          "#F59E0B",
                        ],
                      ] as const
                    ).map(([label, v, c]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-[12px]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: c }}
                            />
                            {label}
                          </span>
                          <span className="num font-semibold">{round(v, 1)}%</span>
                        </div>
                        <Bar value={v} max={Math.max(20, v)} color={c} />
                      </div>
                    ))}
                    <label className="flex items-center justify-between text-[12px]">
                      Show change overlay
                      <Switch
                        checked={showOverlay}
                        onChange={setShowOverlay}
                        label="Show change overlay"
                      />
                    </label>
                    <p className="text-[10.5px] text-[#64748b]">
                      {result.width}×{result.height} px at zoom {result.zoom}.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>

        <div className="flex gap-2 rounded-lg border border-white/[0.06] p-3 text-[11px] leading-relaxed text-[#94a3b8]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            VARI = (G − R) ÷ (G + R − B) on RGB imagery, vegetation where VARI &gt; 0.08. It
            approximates NDVI without a near-infrared band, so season, haze and sensor differences
            between dates add noise — treat results as indicative and confirm on the imagery. For
            model-based change detection, the PyTorch Siamese U-Net runs on the optional Python
            backend.
          </span>
        </div>
      </aside>
    </div>
  );
}
