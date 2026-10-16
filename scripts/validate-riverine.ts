/**
 * Riverine model gate test (judge review): Masjid Jamek must read HIGH and the
 * nearby hill (Bukit Nanas) must read LOW.
 *
 *   bun scripts/validate-riverine.ts            # real DEM + live OSM (needs Overpass access)
 *   bun scripts/validate-riverine.ts --fixture  # real DEM + approximate river fixture
 *
 * Elevation always comes from the real Terrarium/SRTM tiles. The fixture mode
 * replaces only the OSM river centrelines with a hand-digitised approximation of
 * the Klang/Gombak reach around the confluence, for environments where Overpass
 * is not reachable. The in-app "Validation" panel (Methodology page) runs the
 * same test against live OSM data.
 */
import { analyzeArea, inspectPoint } from "@/lib/geo/analyze";
import { decodeTerrarium, terrariumUrl, type TileDecoder } from "@/lib/geo/dem";
import { DEFAULT_FLOOD_PARAMS } from "@/lib/geo/flood";
import { bboxFromCenter, formatDistance } from "@/lib/geo/math";
import type { AreaOfInterest, OsmData } from "@/types/geo";
import { decodePng } from "../tests/helpers/png";

const useFixture = process.argv.includes("--fixture");

const nodeDecoder: TileDecoder = async (z, x, y) => {
  const res = await fetch(terrariumUrl(z, x, y));
  if (!res.ok) throw new Error(`DEM ${z}/${x}/${y}: HTTP ${res.status}`);
  const png = decodePng(new Uint8Array(await res.arrayBuffer()));
  return decodeTerrarium(png.data, png.channels);
};

const FIXTURE: OsmData = {
  channels: [
    {
      id: 1,
      kind: "river",
      name: "Sungai Klang (approx. fixture)",
      coords: [
        [3.14895, 101.69585],
        [3.1468, 101.6963],
        [3.1452, 101.6958],
        [3.1428, 101.6952],
        [3.1398, 101.6938],
      ],
    },
    {
      id: 2,
      kind: "river",
      name: "Sungai Gombak (approx. fixture)",
      coords: [
        [3.1575, 101.6968],
        [3.1545, 101.6964],
        [3.1515, 101.696],
        [3.14895, 101.69585],
      ],
    },
  ],
  areas: [],
  buildings: [],
  buildingsTruncated: false,
  roads: [],
  pois: [],
  endpoint: "fixture",
  fetchedAt: Date.now(),
};

const POINTS = [
  { name: "Masjid Jamek (confluence)", lat: 3.14907, lng: 101.69564, expect: "High" },
  { name: "Dataran Merdeka", lat: 3.14779, lng: 101.6935, expect: "High|Moderate" },
  { name: "Bukit Nanas (forest hill)", lat: 3.15212, lng: 101.70316, expect: "Low" },
  { name: "KL Tower (hilltop)", lat: 3.15284, lng: 101.70386, expect: "Low" },
];

const aoi: AreaOfInterest = {
  id: "validation-kl",
  name: "Masjid Jamek – Bukit Nanas validation",
  bbox: bboxFromCenter([3.1505, 101.6995], 2400, 1600),
  source: "preset",
  createdAt: Date.now(),
};

const analysis = await analyzeArea(aoi, {
  demDecoder: nodeDecoder,
  osm: useFixture ? FIXTURE : undefined,
  params: DEFAULT_FLOOD_PARAMS,
});

console.log(
  `\nRiverine gate test — ${useFixture ? "real DEM + river FIXTURE" : "real DEM + live OSM"}`,
);
console.log(
  `Grid ${analysis.grid.rows}×${analysis.grid.cols} @ ${analysis.grid.cellW.toFixed(0)} m, DEM z${analysis.terrain.demZoom}`,
);
console.log(
  `Terrain ${analysis.terrain.minM.toFixed(1)}–${analysis.terrain.maxM.toFixed(1)} m · ${analysis.warnings.join(" | ") || "no warnings"}`,
);
let pass = true;
for (const p of POINTS) {
  const c = inspectPoint(analysis, p.lat, p.lng)!;
  const ok = new RegExp(`^(${p.expect})$`).test(c.cls);
  pass &&= ok;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${p.name.padEnd(28)} RFSI ${c.index.toFixed(2)} ${c.cls.padEnd(8)}` +
      ` elev ${c.elevationM.toFixed(1)} m · river bed ${c.channelElevationM.toFixed(1)} m · HAND ${c.handM.toFixed(1)} m` +
      ` · dist ${formatDistance(c.distanceM)} · slope ${c.slopeDeg.toFixed(1)}°  (expect ${p.expect})`,
  );
}
console.log(pass ? "\nGATE: PASS" : "\nGATE: FAIL");
process.exit(pass ? 0 : 1);
