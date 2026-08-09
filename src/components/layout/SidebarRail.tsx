import { Link, useRouterState } from "@tanstack/react-router";
import {
  Crosshair,
  Map as MapIcon,
  Timer,
  Activity,
  ShieldCheck,
  Sparkles,
  FileText,
  Database,
  Settings as SettingsIcon,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainViews = [
  { to: "/", label: "COMMAND", icon: Crosshair },
  { to: "/analysis", label: "ANALYSIS", icon: MapIcon },
  { to: "/change-detection", label: "CHANGE", icon: Timer },
  { to: "/livability", label: "INTELLIGENCE", icon: Activity },
  { to: "/planning", label: "SUITABILITY", icon: ShieldCheck },
  { to: "/ai-copilot", label: "COPILOT", icon: Sparkles },
  { to: "/reports", label: "REPORTS", icon: FileText },
  { to: "/data", label: "DATA", icon: Database },
] as const;

const bottomViews = [
  { to: "/settings", label: "SETTINGS", icon: SettingsIcon },
  { to: "/help", label: "HELP", icon: HelpCircle },
] as const;

export function SidebarRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-[64px] shrink-0 flex-col items-center justify-between border-r border-white/10 bg-[#0B0C0E] py-3 z-30">
      {/* Top / Main Navigation List */}
      <div className="flex flex-col gap-3.5 overflow-y-auto pr-0.5">
        {mainViews.map((v) => {
          const isActive = v.to === "/" ? pathname === "/" : pathname.startsWith(v.to);
          const Icon = v.icon;

          return (
            <Link
              key={v.to}
              to={v.to}
              title={v.label}
              className={cn(
                "group relative flex h-10 w-11 flex-col items-center justify-center rounded transition-all",
                isActive
                  ? "bg-[#16171A] text-[#5EEAD4] shadow-[0_0_12px_rgba(94,234,212,0.15)]"
                  : "text-[#9CA3AF] hover:bg-[#16171A]/60 hover:text-[#F5F5F4]",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#5EEAD4] rounded-r" />
              )}
              <Icon className="h-4 w-4 stroke-[1.25]" />
              <span className="mt-0.5 font-mono text-[7px] tracking-wider uppercase font-semibold">
                {v.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Pinned Bottom System Navigation (Settings & Help) */}
      <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
        {bottomViews.map((v) => {
          const isActive = pathname.startsWith(v.to);
          const Icon = v.icon;

          return (
            <Link
              key={v.to}
              to={v.to}
              title={v.label}
              className={cn(
                "group relative flex h-10 w-11 flex-col items-center justify-center rounded transition-all",
                isActive
                  ? "bg-[#16171A] text-[#5EEAD4] shadow-[0_0_12px_rgba(94,234,212,0.15)]"
                  : "text-[#9CA3AF] hover:bg-[#16171A]/60 hover:text-[#F5F5F4]",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#5EEAD4] rounded-r" />
              )}
              <Icon className="h-4 w-4 stroke-[1.25]" />
              <span className="mt-0.5 font-mono text-[7px] tracking-wider uppercase font-semibold">
                {v.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
