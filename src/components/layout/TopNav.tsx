import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, MapPin, Sparkles } from "lucide-react";
import { GinkgoMark } from "@/components/brand/GinkgoLogo";
import { locations } from "@/data/sites";
import { useGinkgo } from "@/state/ginkgo-store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/analysis", label: "Analysis" },
  { to: "/change-detection", label: "Change" },
  { to: "/livability", label: "Livability" },
  { to: "/planning", label: "Planning" },
  { to: "/reports", label: "Reports" },
  { to: "/data", label: "Data" },
] as const;

export function TopNav() {
  const { location, setLocation, thinking } = useGinkgo();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-14 items-center gap-6 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <GinkgoMark className="h-7 w-7" />
          <span className="text-[16px] font-semibold tracking-tight">Ginkgo</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-md border border-border px-2.5 py-1.5 md:flex">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent text-[12.5px] font-medium outline-none"
              aria-label="Study location"
            >
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <Link
            to="/ai-copilot"
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">AI Copilot</span>
            <span
              className={cn(
                "ml-0.5 h-1.5 w-1.5 rounded-full",
                thinking ? "bg-warning status-pulse" : "bg-success",
              )}
            />
          </Link>

          <button
            className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>

          <div className="flex items-center gap-2 border-l border-border pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-accent-foreground">
              LQ
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-[12.5px] font-medium">Luqman</div>
              <div className="text-[10.5px] text-muted-foreground">Urban Planner</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
