import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>{children}</main>
    </div>
  );
}

/** Single shared application header, used on every route via AppShell. */
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
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-card px-6 py-5">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
