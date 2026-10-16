import { describe, expect, test } from "bun:test";
import { utmToLatLng } from "@/lib/geo/importers";

describe("UTM inverse projection", () => {
  test("central meridian of zone 47N at the equator", () => {
    const [lat, lng] = utmToLatLng(500000, 0, 47, false);
    expect(lat).toBeCloseTo(0, 6);
    expect(lng).toBeCloseTo(99, 6);
  });
  test("3°N on the zone 47 central meridian (northing = k0 · meridian arc)", () => {
    const [lat, lng] = utmToLatLng(500000, 0.9996 * 331_730.5, 47, false);
    expect(lat).toBeCloseTo(3, 3);
    expect(lng).toBeCloseTo(99, 6);
  });
  test("east/west symmetry about the central meridian (zone 48N)", () => {
    const a = utmToLatLng(600000, 350000, 48, false);
    const b = utmToLatLng(400000, 350000, 48, false);
    expect(a[0]).toBeCloseTo(b[0], 8);
    expect(a[1] - 105).toBeCloseTo(105 - b[1], 8);
  });
});
