import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import {
  filterQuickPlaces,
  parseCoordinates,
  searchNominatim,
  searchPhoton,
  type PlaceResult,
} from "@/lib/geo/geocode";
import { formatLatLng } from "@/lib/geo/math";
import { cn } from "@/lib/utils";
import type { LatLng } from "@/types/geo";

/**
 * Place search. Typeahead uses Photon (OSM, permits search-as-you-type);
 * Enter falls back to Nominatim. Coordinates ("3.149, 101.695") are parsed locally.
 */
export function MapSearch({
  onSelect,
  near,
  className,
}: {
  onSelect: (place: PlaceResult) => void;
  near?: LatLng | undefined;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const quick = filterQuickPlaces(q);
  const coord = parseCoordinates(q);
  const coordResult: PlaceResult[] = coord
    ? [
        {
          id: "coord",
          name: formatLatLng(coord),
          detail: "Coordinates",
          center: coord,
          kind: "point",
        },
      ]
    : [];
  const items = [
    ...coordResult,
    ...quick,
    ...results.filter((r) => !quick.some((p) => p.name === r.name)),
  ];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setActive(0);
    const term = q.trim();
    abortRef.current?.abort();
    if (term.length < 3 || coord) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    const t = setTimeout(() => {
      searchPhoton(term, ctrl.signal, near)
        .then((r) => {
          setResults(r);
          setError(null);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setError("Live search unavailable — press Enter to retry");
        })
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    }, 380);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const choose = (p: PlaceResult) => {
    onSelect(p);
    setQ(p.name);
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const submit = async () => {
    if (items[active]) return choose(items[active]!);
    const term = q.trim();
    if (term.length < 2) return;
    setLoading(true);
    try {
      const r = await searchNominatim(term);
      setResults(r);
      setError(r.length ? null : "No places found");
      if (r[0]) choose(r[0]);
    } catch {
      setError("Search service unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <div className="glass flex h-10 items-center gap-2 rounded-xl px-3">
        <Search className="h-4 w-4 shrink-0 text-[#94a3b8]" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search place, address or lat, lng"
          aria-label="Search places"
          role="combobox"
          aria-expanded={open}
          aria-controls="gk-search-list"
          className="h-full w-full min-w-0 bg-transparent text-[13px] text-white outline-none placeholder:text-[#64748b]"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#94a3b8]" />}
        {q && !loading && (
          <button
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            className="rounded p-0.5 text-[#64748b] hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (items.length > 0 || error) && (
        <div
          id="gk-search-list"
          role="listbox"
          className="glass absolute left-0 right-0 top-12 z-[1100] max-h-[min(60vh,380px)] overflow-y-auto rounded-xl p-1 animate-fade-in scroll-thin"
        >
          {!q && (
            <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#64748b]">
              Quick places
            </div>
          )}
          {items.map((p, i) => (
            <button
              key={p.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(p)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left",
                i === active ? "bg-white/[0.08]" : "hover:bg-white/[0.05]",
              )}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium text-white">{p.name}</div>
                <div className="truncate text-[11px] text-[#94a3b8]">{p.detail}</div>
              </div>
              <span className="mt-0.5 shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] capitalize text-[#94a3b8]">
                {p.kind}
              </span>
            </button>
          ))}
          {error && <div className="px-2.5 py-2 text-[11.5px] text-[#f59e0b]">{error}</div>}
          <div className="px-2.5 pb-1 pt-1.5 text-[9.5px] text-[#64748b]">
            Search © OpenStreetMap contributors (Photon / Nominatim)
          </div>
        </div>
      )}
    </div>
  );
}
