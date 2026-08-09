import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { SidebarRail } from "./SidebarRail";
import { AIDock } from "@/components/ai/AIDock";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0B0C0E] text-[#F5F5F4]">
      {/* Top Header Status Bar */}
      <TopNav />

      {/* Main Viewport Shell with Persistent Left Rail */}
      <div className="flex flex-1 overflow-hidden">
        <SidebarRail />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-[#0B0C0E]">
          {children}
        </main>
      </div>

      {/* Floating AI Dock Overlay (Views 1, 2, 4) */}
      <AIDock />
    </div>
  );
}

export const AppHeader = TopNav;

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#16171A] px-6 py-4 font-mono">
      <div>
        <h1 className="text-[18px] font-bold uppercase tracking-wider text-[#F5F5F4]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-[11px] uppercase tracking-wide text-[#9CA3AF]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
