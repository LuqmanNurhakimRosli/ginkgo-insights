import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { datasets } from "@/data/reports";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data Sources — Ginkgo" },
      { name: "description", content: "Satellite, vector and statistical datasets powering Ginkgo's spatial analysis." },
      { property: "og:title", content: "Data Sources — Ginkgo" },
      { property: "og:description", content: "Satellite, vector and statistical datasets powering Ginkgo's spatial analysis." },
    ],
  }),
  component: DataPage,
});

function DataPage() {
  return (
    <div>
      <PageHeader title="Data Sources" subtitle="Every layer, its provenance, resolution and refresh cadence." />
      <div className="px-5 py-5">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-surface text-muted-foreground">
              <tr>
                {["Dataset", "Location", "Type", "Period", "Updated", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-2.5 font-medium">{d.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.location}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.type}</td>
                  <td className="num px-4 py-2.5 text-muted-foreground">{d.period}</td>
                  <td className="num px-4 py-2.5 text-muted-foreground">{d.updated}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">
          Prototype build: values are representative mock data prepared for demonstration.
        </p>
      </div>
    </div>
  );
}
