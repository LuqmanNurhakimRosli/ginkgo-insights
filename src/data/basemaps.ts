export type BasemapId = "satellite" | "streets" | "dark" | "light" | "topo";

export interface BasemapDef {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  maxNativeZoom: number;
  subdomains?: string;
  /** Overlay labels (place names / roads) on top of imagery. */
  labelsUrl?: string;
}

const ESRI = "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community";
const OSM = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const BASEMAPS: BasemapDef[] = [
  {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labelsUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: ESRI,
    maxNativeZoom: 19,
  },
  {
    id: "streets",
    label: "Streets",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM,
    maxNativeZoom: 19,
  },
  {
    id: "dark",
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: `${OSM} © <a href="https://carto.com/attributions">CARTO</a>`,
    maxNativeZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "light",
    label: "Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: `${OSM} © <a href="https://carto.com/attributions">CARTO</a>`,
    maxNativeZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "topo",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: `${OSM}, SRTM | Style © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`,
    maxNativeZoom: 17,
    subdomains: "abc",
  },
];

export const getBasemap = (id: string) => BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0]!;

/** Historical imagery sources for the Change module. */
export interface ImageryRelease {
  id: string;
  label: string;
  date: string;
  url: string;
  attribution: string;
  maxNativeZoom: number;
  source: "wayback" | "s2";
}

const EOX_ATTR = (y: string) =>
  `Sentinel-2 cloudless – <a href="https://s2maps.eu">s2maps.eu</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data ${y})`;

/** EOX Sentinel-2 cloudless annual mosaics (10 m). 2016 is CC BY 4.0; later years CC BY-NC-SA 4.0. */
export const S2_YEARS: ImageryRelease[] = [
  ["2016", "s2cloudless_3857"],
  ["2018", "s2cloudless-2018_3857"],
  ["2019", "s2cloudless-2019_3857"],
  ["2020", "s2cloudless-2020_3857"],
  ["2021", "s2cloudless-2021_3857"],
  ["2022", "s2cloudless-2022_3857"],
  ["2023", "s2cloudless-2023_3857"],
  ["2024", "s2cloudless-2024_3857"],
].map(([year, layer]) => ({
  id: `s2-${year}`,
  label: `Sentinel-2 ${year}`,
  date: `${year}`,
  url: `https://tiles.maps.eox.at/wmts/1.0.0/${layer}/default/g/{z}/{y}/{x}.jpg`,
  attribution: EOX_ATTR(year!),
  maxNativeZoom: 14,
  source: "s2" as const,
}));

export const WAYBACK_CONFIG_URL =
  "https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json";
export const waybackUrl = (release: number) =>
  `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${release}/{z}/{y}/{x}`;

/** Fallback: first Esri World Imagery Wayback release of each year (from waybackconfig.json, Sep 2026). */
export const WAYBACK_FALLBACK: Array<[string, number]> = [
  ["2014-02-20", 10],
  ["2015-01-21", 20222],
  ["2016-01-13", 3515],
  ["2017-01-11", 577],
  ["2018-01-08", 13161],
  ["2019-01-09", 6036],
  ["2020-01-08", 23001],
  ["2021-01-13", 1049],
  ["2022-01-12", 42663],
  ["2023-01-11", 11475],
  ["2024-01-18", 41468],
  ["2025-01-30", 36557],
  ["2026-01-29", 22252],
  ["2026-09-24", 63116],
];

export const toWaybackRelease = ([date, id]: [string, number]): ImageryRelease => ({
  id: `wb-${id}`,
  label: `World Imagery ${date}`,
  date,
  url: waybackUrl(id),
  attribution: "Esri World Imagery Wayback — Esri, Maxar, Earthstar Geographics",
  maxNativeZoom: 19,
  source: "wayback",
});
