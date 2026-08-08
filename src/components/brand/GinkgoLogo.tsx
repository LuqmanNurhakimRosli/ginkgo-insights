export function GinkgoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Ginkgo mark"
      fill="none"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
      <path
        d="M16 6.5c-3.6 2.3-6.6 5.9-6.6 9.9 0 3.3 2.9 5.6 6.6 5.6s6.6-2.3 6.6-5.6c0-4-3-7.6-6.6-9.9Z"
        fill="var(--color-primary-foreground)"
        fillOpacity="0.94"
      />
      <path d="M16 6.5v15.5" stroke="var(--color-primary)" strokeWidth="1.1" />
      <path d="M11.2 19.4 16 22M20.8 19.4 16 22" stroke="var(--color-primary)" strokeWidth="0.9" />
      <path
        d="M16 22v3.5"
        stroke="var(--color-primary-foreground)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GinkgoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <GinkgoMark />
      <div className="leading-none">
        <div className="text-[17px] font-semibold tracking-tight text-foreground">Ginkgo</div>
        {!compact && (
          <div className="mt-1 text-[10.5px] font-medium leading-snug text-muted-foreground">
            AI Spatial Intelligence for
            <br />
            Sustainable &amp; Livable Cities
          </div>
        )}
      </div>
    </div>
  );
}
