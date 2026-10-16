import { describe, expect, test } from "bun:test";
import {
  areaClass,
  DEFAULT_FLOOD_PARAMS as P,
  floodIndex,
  riskClass,
  sensitivitySweep,
} from "@/lib/geo/flood";

const isNonIncreasing = (xs: number[]) => xs.every((v, i) => i === 0 || v <= xs[i - 1]! + 1e-12);

describe("riverine flood susceptibility index (RFSI)", () => {
  // Sensitivity step (c) from the judge review: score must fall monotonically
  // as elevation above the river rises, all else held constant.
  test("falls monotonically with height above the river", () => {
    const sweep = sensitivitySweep(
      { distanceM: 50, handM: 0, slopeDeg: 1 },
      "handM",
      [0, 1, 2, 3, 5, 8, 12, 20, 40, 80],
    );
    expect(isNonIncreasing(sweep.map((s) => s.index))).toBe(true);
    expect(sweep[0]!.index - sweep.at(-1)!.index).toBeGreaterThan(0.4);
  });

  // Step (d): distance to river is a formula term with the correct polarity.
  test("falls monotonically with distance from the river", () => {
    const sweep = sensitivitySweep(
      { distanceM: 0, handM: 1, slopeDeg: 1 },
      "distanceM",
      [0, 25, 50, 100, 200, 400, 800, 1600],
    );
    expect(isNonIncreasing(sweep.map((s) => s.index))).toBe(true);
    expect(sweep[0]!.index - sweep.at(-1)!.index).toBeGreaterThan(0.3);
  });

  test("falls monotonically with slope", () => {
    const sweep = sensitivitySweep(
      { distanceM: 100, handM: 2, slopeDeg: 0 },
      "slopeDeg",
      [0, 2, 5, 8, 10, 20, 40],
    );
    expect(isNonIncreasing(sweep.map((s) => s.index))).toBe(true);
  });

  // The "flat-area bug": flat terrain alone must never read as Moderate/High.
  test("a flat plain far from any river stays Low", () => {
    const far = floodIndex({ distanceM: 2000, handM: 15, slopeDeg: 0 });
    expect(riskClass(far.index)).toBe("Low");
    const noRiver = floodIndex({ distanceM: Infinity, handM: NaN, slopeDeg: 0 });
    expect(noRiver.index).toBeLessThan(P.moderateAt);
  });

  test("riverbank at river level reads High; hilltop reads Low", () => {
    expect(riskClass(floodIndex({ distanceM: 10, handM: 0.5, slopeDeg: 1 }).index)).toBe("High");
    expect(riskClass(floodIndex({ distanceM: 900, handM: 55, slopeDeg: 9 }).index)).toBe("Low");
  });

  test("history term is excluded and renormalised when no verified layer exists", () => {
    const a = floodIndex({ distanceM: 0, handM: 0, slopeDeg: 0 });
    expect(a.index).toBeCloseTo(1, 6);
    const withHistory = floodIndex({ distanceM: 0, handM: 0, slopeDeg: 0, history: 0 });
    expect(withHistory.index).toBeLessThan(1);
  });

  test("area class thresholds", () => {
    expect(areaClass({ Low: 0.7, Moderate: 0.05, High: 0.25 })).toBe("High");
    expect(areaClass({ Low: 0.75, Moderate: 0.15, High: 0.1 })).toBe("Moderate");
    expect(areaClass({ Low: 0.9, Moderate: 0.08, High: 0.02 })).toBe("Low");
  });
});
