import { useState } from "react";
import { Search } from "lucide-react";
import { sites } from "@/data/sites";
import { useGinkgo } from "@/state/ginkgo-store";

export function MapSearch() {
  const [q, setQ] = useState("");
  const { selectSite } = useGinkgo();
  const matches = q
    ? sites.filter(
        (s) =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.locality.toLowerCase().includes(q.toLowerCase()),
      )
    : [];

  return (
    <div className="relative w-[320px] max-w-[60vw]">
      <div className="ginkgo-float flex items-center gap-2 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search area or address..."
          className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
        />
      </div>
      {matches.length > 0 && (
        <div className="ginkgo-float absolute mt-1 w-full overflow-hidden">
          {matches.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                selectSite(s.id);
                setQ("");
              }}
              className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-secondary"
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-muted-foreground"> · {s.locality}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
