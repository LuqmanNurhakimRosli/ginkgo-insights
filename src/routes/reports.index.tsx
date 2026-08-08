import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { buildReport } from "@/data/reports";
import { sites } from "@/data/sites";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Reports & Export — Ginkgo" },
      { name: "description", content: "Generate a full spatial planning assessment with evidence, findings and disclaimers." },
      { property: "og:title", content: "Reports & Export — Ginkgo" },
      { property: "og:description", content: "Generate a full spatial planning assessment with evidence, findings and disclaimers." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const site = useSelectedSite();
  const { selectSite } = useGinkgo();
  const report = buildReport(site.id);

  return (
    <div>
      <PageHeader
        title="Reports & Export"
        subtitle="A complete, citable assessment assembled from every analysis module."
        actions={
          <select value={site.id} onChange={(e) => selectSite(e.target.value)} className="rounded-md border border-border px-2 py-1.5 text-[12.5px]">
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />
      <div className="px-5 py-5">
        <article className="ginkgo-panel mx-auto max-w-3xl px-7 py-7">
          <div className="label-caps">{report.id} · {report.status} · {report.generatedAt}</div>
          <h1 className="mt-2 text-[20px] font-semibold tracking-tight">{report.title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{report.summary}</p>
          <div className="mt-5 space-y-4">
            {report.sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-[13.5px] font-semibold">{s.title}</h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{s.body}</p>
              </section>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Export PDF", "Export JSON", "Export GeoJSON"].map((l) => (
              <button key={l} className="rounded-md border border-border px-3 py-2 text-[12.5px] font-semibold hover:bg-secondary">
                {l}
              </button>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
