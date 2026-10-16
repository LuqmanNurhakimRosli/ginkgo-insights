import { describe, expect, test } from "bun:test";
import { computeAnalysis, inspectPoint, reweight } from "@/lib/geo/analyze";
import type { DemSampler } from "@/lib/geo/dem";
import { DEFAULT_FLOOD_PARAMS } from "@/lib/geo/flood";
import { bboxFromCenter, metresPerDegree } from "@/lib/geo/math";
import { assembleRings, classifyTags, parseOverpass } from "@/lib/geo/osm";
import { LandClass, type AreaOfInterest, type OsmData } from "@/types/geo";

const CENTER: [number, number] = [3.15, 101.7];
const m = metresPerDegree(CENTER[0]);

/** Synthetic V-shaped valley: river runs north–south through the centre at 30 m; walls rise 4 m per 100 m. */
const valley = {
  z: 14,
  sample: (_lat: number, lng: number) => 30 + Math.abs((lng - CENTER[1]) * m.lng) * 0.04,
  sampleMin(lat: number, lng: number) {
    return this.sample(lat, lng);
  },
} as unknown as DemSampler;

const river: OsmData = {
  channels: [
    {
      id: 1,
      kind: "river",
      name: "Sungai Ujian",
      coords: [
        [CENTER[0] - 0.03, CENTER[1]],
        [CENTER[0] + 0.03, CENTER[1]],
      ],
    },
  ],
  areas: [
    {
      id: 2,
      cls: LandClass.Vegetation,
      tag: "leisure=park",
      rings: [
        [
          [3.149, 101.704],
          [3.149, 101.706],
          [3.151, 101.706],
          [3.151, 101.704],
          [3.149, 101.704],
        ],
      ],
    },
  ],
  buildings: [],
  buildingsTruncated: false,
  roads: [],
  pois: [],
  endpoint: "fixture",
  fetchedAt: 0,
};

const aoi: AreaOfInterest = {
  id: "t",
  name: "Synthetic valley",
  bbox: bboxFromCenter(CENTER, 2000),
  source: "draw",
  createdAt: 0,
};

describe("computeAnalysis on a synthetic valley", () => {
  const a = computeAnalysis(aoi, valley, river, DEFAULT_FLOOD_PARAMS);

  test("valley floor next to the river is High", () => {
    const p = inspectPoint(a, CENTER[0], CENTER[1] + 20 / m.lng)!;
    expect(p.cls).toBe("High");
    expect(p.channelName).toBe("Sungai Ujian");
    expect(p.distanceM).toBeLessThan(40);
  });

  test("valley wall 900 m away is Low", () => {
    const p = inspectPoint(a, CENTER[0], CENTER[1] + 900 / m.lng)!;
    expect(p.handM).toBeGreaterThan(30);
    expect(p.cls).toBe("Low");
  });

  test("susceptibility decreases moving up the valley wall", () => {
    const xs = [0, 100, 200, 400, 700, 950].map(
      (d) => inspectPoint(a, CENTER[0], CENTER[1] + d / m.lng)!.index,
    );
    expect(xs.every((v, i) => i === 0 || v <= xs[i - 1]! + 1e-6)).toBe(true);
  });

  test("land cover rasterises OSM park polygon", () => {
    expect(a.landCover.greenPct).toBeGreaterThan(0);
    const p = inspectPoint(a, 3.15, 101.705)!;
    expect(p.landClass).toBe(LandClass.Vegetation);
  });

  test("summary shares sum to 1 and scores are bounded", () => {
    const s = a.flood.shares;
    expect(s.Low + s.Moderate + s.High).toBeCloseTo(1, 6);
    expect(a.scores.livability.score).toBeGreaterThanOrEqual(0);
    expect(a.scores.livability.score).toBeLessThanOrEqual(100);
    expect(a.flood.riverReserveSharePct).toBeGreaterThan(0);
  });

  test("reweight recomputes without refetching", () => {
    const strict = reweight(a, { ...DEFAULT_FLOOD_PARAMS, highAt: 0.95 });
    expect(strict.flood.shares.High).toBeLessThanOrEqual(a.flood.shares.High);
  });
});

describe("OSM parsing", () => {
  test("classifies tags into the 5-class legend", () => {
    expect(classifyTags({ landuse: "residential" })?.cls).toBe(LandClass.BuiltUp);
    expect(classifyTags({ natural: "water" })?.cls).toBe(LandClass.Water);
    expect(classifyTags({ landuse: "farmland" })?.cls).toBe(LandClass.Agriculture);
    expect(classifyTags({ leisure: "park" })?.cls).toBe(LandClass.Vegetation);
    expect(classifyTags({ highway: "primary" })).toBeNull();
  });

  test("assembles relation member ways into a closed ring", () => {
    const rings = assembleRings([
      [
        [0, 0],
        [0, 1],
      ],
      [
        [1, 1],
        [0, 1],
      ],
      [
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ]);
    expect(rings.length).toBe(1);
    expect(rings[0]!.length).toBe(5);
  });

  test("parses channels, roads, POIs and buildings", () => {
    const osm = parseOverpass(
      [
        {
          type: "way",
          id: 1,
          tags: { waterway: "river", name: "Sungai Klang" },
          geometry: [
            { lat: 0, lon: 0 },
            { lat: 1, lon: 1 },
          ],
        },
        {
          type: "way",
          id: 2,
          tags: { highway: "primary" },
          geometry: [
            { lat: 0, lon: 0 },
            { lat: 0, lon: 1 },
          ],
        },
        { type: "node", id: 3, lat: 0.5, lon: 0.5, tags: { amenity: "school", name: "SK Test" } },
        { type: "way", id: 4, center: { lat: 0.2, lon: 0.2 }, tags: { amenity: "hospital" } },
        {
          type: "way",
          id: 5,
          tags: { building: "yes" },
          geometry: [
            { lat: 0, lon: 0 },
            { lat: 0, lon: 0.001 },
            { lat: 0.001, lon: 0.001 },
            { lat: 0, lon: 0 },
          ],
        },
      ],
      "fixture",
    );
    expect(osm.channels[0]?.name).toBe("Sungai Klang");
    expect(osm.roads.length).toBe(1);
    expect(osm.pois.map((p) => p.category).sort()).toEqual(["education", "health"]);
    expect(osm.buildings.length).toBe(1);
  });
});

describe("DEM void cleaning", () => {
  test("removes implausible negatives and pits, keeps terrain", async () => {
    const { cleanTile } = await import("@/lib/geo/dem");
    const t = new Float32Array(256 * 256).fill(30);
    for (let i = 0; i < 256; i++) t[100 * 256 + i] = 30 + i * 0.1; // gentle ramp row kept
    t[50 * 256 + 50] = -119; // void
    for (let y = 120; y < 126; y++) for (let x = 120; x < 126; x++) t[y * 256 + x] = -5; // 6×6 pit, 35 m deep
    const removed = cleanTile(t);
    expect(Number.isNaN(t[50 * 256 + 50]!)).toBe(true);
    expect(Number.isNaN(t[122 * 256 + 122]!)).toBe(true);
    expect(t[100 * 256 + 200]).toBeCloseTo(50, 5);
    expect(removed).toBe(1 + 36);
  });
});
