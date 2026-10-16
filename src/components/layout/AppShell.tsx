import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MoreHorizontal, X } from "lucide-react";
import { GinkgoMark } from "@/components/brand/GinkgoLogo";
import { useGinkgo } from "@/state/ginkgo-store";
import { cn } from "@/lib/utils";
import { isActive, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav";

function RailLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.to);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      title={item.title}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-12 w-14 flex-col items-center justify-center gap-1 rounded-lg transition-colors",
        active
          ? "bg-white text-[#090a0c]"
          : "text-[#94a3b8] hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.6} />
      <span className="text-[9.5px] font-medium leading-none">{item.label}</span>
    </Link>
  );
}

function StatusDot() {
  const { status, analysis } = useGinkgo();
  const color =
    status === "running"
      ? "bg-[#f59e0b] animate-pulse-soft"
      : status === "error"
        ? "bg-[#ef4444]"
        : analysis
          ? "bg-[#10b981]"
          : "bg-white/25";
  const label =
    status === "running"
      ? "Analysing"
      : status === "error"
        ? "Analysis failed"
        : analysis
          ? "Area analysed"
          : "No area";
  return <span className={cn("h-2 w-2 rounded-full", color)} title={label} aria-label={label} />;
}

function DesktopRail({ pathname }: { pathname: string }) {
  return (
    <aside className="no-print hidden h-full w-[72px] shrink-0 flex-col items-center border-r border-white/[0.08] bg-[#0b0c0f] py-3 lg:flex">
      <Link to="/" className="mb-3 flex flex-col items-center gap-1" title="Ginkgo">
        <GinkgoMark className="h-8 w-8" />
      </Link>
      <nav
        className="flex flex-1 flex-col items-center gap-1 overflow-y-auto scroll-thin"
        aria-label="Main"
      >
        {PRIMARY_NAV.map((item) => (
          <RailLink key={item.to} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="mt-2 flex flex-col items-center gap-1 border-t border-white/[0.08] pt-2">
        {SECONDARY_NAV.map((item) => (
          <RailLink key={item.to} item={item} pathname={pathname} />
        ))}
        <div className="mt-2 flex h-6 items-center">
          <StatusDot />
        </div>
      </div>
    </aside>
  );
}

function MobileTopBar({ pathname }: { pathname: string }) {
  const { analysis, aoi } = useGinkgo();
  const current = [...PRIMARY_NAV, ...SECONDARY_NAV].find((n) => isActive(pathname, n.to));
  return (
    <header className="no-print pt-safe flex shrink-0 items-center gap-2.5 border-b border-white/[0.08] bg-[#0b0c0f] px-3 lg:hidden">
      <div className="flex h-12 items-center gap-2.5">
        <GinkgoMark className="h-7 w-7" />
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">{current?.title ?? "Ginkgo"}</div>
          <div className="max-w-[60vw] truncate text-[11px] text-[#94a3b8]">
            {(analysis?.aoi ?? aoi)?.name ?? "Spatial decision intelligence"}
          </div>
        </div>
      </div>
      <div className="ml-auto">
        <StatusDot />
      </div>
    </header>
  );
}

function MobileTabBar({ pathname }: { pathname: string }) {
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);
  const tabs = PRIMARY_NAV.filter((n) => n.mobile);
  const rest = [...PRIMARY_NAV.filter((n) => !n.mobile), ...SECONDARY_NAV];
  const moreActive = rest.some((n) => isActive(pathname, n.to));
  return (
    <>
      <nav
        className="no-print pb-safe relative z-[900] shrink-0 border-t border-white/[0.08] bg-[#0b0c0f] lg:hidden"
        aria-label="Main"
      >
        <div className="grid h-14 grid-cols-5">
          {tabs.map((item) => {
            const active = isActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
                  active ? "text-white" : "text-[#7c8799]",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full",
                    active && "bg-white text-[#090a0c]",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
              moreActive || more ? "text-white" : "text-[#7c8799]",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full",
                (moreActive || more) && "bg-white/10",
              )}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </span>
            More
          </button>
        </div>
      </nav>
      {more && (
        <div
          className="fixed inset-0 z-[2000] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="More pages"
        >
          <button
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={() => setMore(false)}
            aria-label="Close menu"
          />
          <div className="pb-safe absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-white/10 bg-[#14161b] p-4 animate-slide-up">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold">More</span>
              <button
                onClick={() => setMore(false)}
                className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {rest.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-[11.5px] font-medium",
                      active
                        ? "border-white bg-white text-[#090a0c]"
                        : "border-white/[0.08] bg-white/[0.03] text-[#cbd5e1]",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="print-root flex h-dvh w-full overflow-hidden bg-[#090a0c] text-white">
      <DesktopRail pathname={pathname} />
      <div className="print-unclip flex min-w-0 flex-1 flex-col">
        <MobileTopBar pathname={pathname} />
        <main className="print-unclip relative isolate min-h-0 flex-1 overflow-hidden">
          {children}
        </main>
        <MobileTabBar pathname={pathname} />
      </div>
    </div>
  );
}
