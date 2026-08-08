import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Methodology & Help — Ginkgo" },
      { name: "description", content: "How Ginkgo computes change detection, livability and suitability — and the limits of each output." },
      { property: "og:title", content: "Methodology & Help — Ginkgo" },
      { property: "og:description", content: "How Ginkgo computes change detection, livability and suitability — and the limits of each output." },
    ],
  }),
  component: HelpPage,
});

const sections = [
  {
    title: "Change detection",
    body: "Two temporal composites are classified into built-up, vegetation, water and bare land, then differenced per pixel. Reported percentages are area-weighted and carry a model confidence value.",
  },
  {
    title: "Livability index",
    body: "A 100-point weighted composite of green access, mobility, services, environmental quality and safety. Every dimension shows its weight and evidence so the score can be audited.",
  },
  {
    title: "Suitability screening",
    body: "Criteria are scored 0–100 and combined by declared weights. Output is indicative screening only and does not replace statutory planning assessment or field survey.",
  },
  {
    title: "Limitations",
    body: "This build uses representative prototype data. Cloud cover, imagery date gaps and classification error can affect real results; always validate with local records before decisions.",
  },
];

function HelpPage() {
  return (
    <div>
      <PageHeader title="Methodology & Help" subtitle="What Ginkgo measures, how it measures it, and where to be careful." />
      <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
        {sections.map((s) => (
          <article key={s.title} className="ginkgo-panel px-4 py-4">
            <h2 className="text-[13.5px] font-semibold">{s.title}</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
