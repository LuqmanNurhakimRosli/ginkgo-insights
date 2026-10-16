import { useEffect, useRef, useState } from "react";
import type * as LT from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronsLeftRight } from "lucide-react";
import type { ImageryRelease } from "@/data/basemaps";
import type { BBox } from "@/types/geo";
import { loadLeaflet } from "./GinkgoMap";

/**
 * Swipe comparison of two imagery releases on one Leaflet map. The "after"
 * layer lives in its own pane which is clipped to the right of the handle.
 */
export function CompareMap({
  before,
  after,
  bbox,
  overlay,
}: {
  before: ImageryRelease;
  after: ImageryRelease;
  bbox: BBox | null;
  overlay?: { image: string; bbox: BBox; opacity: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LT.Map | null>(null);
  const [L, setL] = useState<typeof LT | null>(null);
  const [pos, setPos] = useState(0.5);
  const posRef = useRef(0.5);
  posRef.current = pos;
  const layers = useRef<{
    before?: LT.TileLayer | undefined;
    after?: LT.TileLayer | undefined;
    aoi?: LT.Layer | undefined;
    overlay?: LT.Layer | undefined;
  }>({});
  const dragging = useRef(false);

  useEffect(() => {
    let alive = true;
    void loadLeaflet().then((l) => alive && setL(l));
    return () => {
      alive = false;
    };
  }, []);

  const clip = () => {
    const map = mapRef.current;
    const pane = map?.getPane("after");
    if (!map || !pane) return;
    const size = map.getSize();
    const nw = map.containerPointToLayerPoint([0, 0]);
    const se = map.containerPointToLayerPoint(size);
    const x = nw.x + size.x * posRef.current;
    pane.style.clip = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${x}px)`;
  };

  useEffect(() => {
    if (!L || !el.current || mapRef.current) return;
    const map = L.map(el.current, {
      zoomControl: true,
      minZoom: 4,
      maxZoom: 19,
      zoomSnap: 0.25,
      center: [3.1505, 101.6995],
      zoom: 15,
    });
    map.zoomControl.setPosition("bottomright");
    map.createPane("after").style.zIndex = "250";
    map.createPane("grids").style.zIndex = "350";
    map.on("move zoom resize", clip);
    mapRef.current = map;
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      clip();
    });
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layers.current = {};
    };
  }, [L]);

  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map) return;
    layers.current.before?.remove();
    layers.current.after?.remove();
    layers.current.before = L.tileLayer(before.url, {
      attribution: before.attribution,
      maxNativeZoom: before.maxNativeZoom,
      maxZoom: 19,
    }).addTo(map);
    layers.current.after = L.tileLayer(after.url, {
      attribution: after.attribution,
      maxNativeZoom: after.maxNativeZoom,
      maxZoom: 19,
      pane: "after",
    }).addTo(map);
    clip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, before.url, after.url]);

  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map) return;
    layers.current.aoi?.remove();
    if (!bbox) return;
    layers.current.aoi = L.rectangle(
      [
        [bbox.south, bbox.west],
        [bbox.north, bbox.east],
      ],
      { color: "#fff", weight: 2, fill: false, dashArray: "6 5", interactive: false },
    ).addTo(map);
    map.fitBounds(
      [
        [bbox.south, bbox.west],
        [bbox.north, bbox.east],
      ],
      { padding: [30, 30], animate: false },
    );
  }, [L, bbox]);

  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map) return;
    layers.current.overlay?.remove();
    layers.current.overlay = undefined;
    if (!overlay) return;
    const b = overlay.bbox;
    layers.current.overlay = L.imageOverlay(
      overlay.image,
      [
        [b.south, b.west],
        [b.north, b.east],
      ],
      { opacity: overlay.opacity, pane: "grids", interactive: false },
    ).addTo(map);
  }, [L, overlay]);

  useEffect(clip, [pos]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current || !wrap.current) return;
      const r = wrap.current.getBoundingClientRect();
      setPos(Math.min(0.98, Math.max(0.02, (e.clientX - r.left) / r.width)));
    };
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div ref={wrap} className="relative isolate h-full w-full select-none bg-[#0d0f12]">
      <div
        ref={el}
        className="absolute inset-0"
        role="application"
        aria-label="Imagery comparison map"
      />
      <div
        className="pointer-events-none absolute inset-y-0 z-[900]"
        style={{ left: `${pos * 100}%` }}
      >
        <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)]" />
        <button
          className="pointer-events-auto absolute top-1/2 -ml-[18px] -mt-[18px] flex h-9 w-9 cursor-ew-resize items-center justify-center rounded-full bg-white text-[#090a0c] shadow-xl"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            dragging.current = true;
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0.02, p - 0.05));
            if (e.key === "ArrowRight") setPos((p) => Math.min(0.98, p + 0.05));
          }}
          role="slider"
          aria-label="Swipe position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos * 100)}
        >
          <ChevronsLeftRight className="h-4 w-4" />
        </button>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 z-[900] rounded-lg bg-black/70 px-2.5 py-1 text-[11.5px] font-medium">
        Before · {before.date}
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-[900] rounded-lg bg-black/70 px-2.5 py-1 text-[11.5px] font-medium">
        After · {after.date}
      </div>
    </div>
  );
}
