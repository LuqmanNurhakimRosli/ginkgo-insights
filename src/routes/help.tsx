import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { BookOpen, ShieldAlert, Cpu, Layers } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "GINKGO — METHODOLOGY & HELP" },
      { name: "description", content: "How Ginkgo computes spatial change, livability, and development suitability." },
    ],
  }),
  component: HelpPage,
});

const sections = [
  {
    icon: Layers,
    title: "SATELLITE TEMPORAL CHANGE DETECTION",
    body: "Two temporal satellite composites (T1: 2023 vs T2: 2025) are classified into built-up, vegetation, water, and bare land, then differenced per pixel. Reported percentages are area-weighted and carry model confidence values.",
  },
  {
    icon: Cpu,
    title: "OPEN-SOURCE AI & SPATIAL REASONING",
    body: "Ginkgo operates on open-source AI delivery architectures (Ollama Local Llama 3 via Docker, Groq Acceleration, and Hugging Face Open GIS Models). AI intent is parsed into spatial bounds, highlights, and layer toggles.",
  },
  {
    icon: BookOpen,
    title: "TRANSPARENT LIVABILITY & SUITABILITY MATRIX",
    body: "A 100-point composite of accessibility, flood risk, green space retention, and infrastructure catchment. Every score is mathematically transparent and audit-ready with directional arrow evidence.",
  },
  {
    icon: ShieldAlert,
    title: "PROTOTYPE LIMITATIONS & PLANNING DISCLAIMER",
    body: "Outputs are indicative screening results for sustainability planning and hackathon demonstration. Statutory planning decisions require ground truth verification and local authority survey.",
  },
];

function HelpPage() {
  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] text-[#F5F5F4] font-mono">
      <PageHeader
        title="METHODOLOGY & SYSTEM DOCUMENTATION"
        subtitle="TECHNICAL OVERVIEW OF SPATIAL FORMULAS, OPEN-SOURCE AI REASONING, AND DATA SPECIFICATIONS."
      />

      <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2 overflow-y-auto">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <article key={s.title} className="rounded border border-white/10 bg-[#16171A] p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase text-[#5EEAD4] border-b border-white/10 pb-2">
                <Icon className="h-4 w-4" />
                <span>{s.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#9CA3AF]">{s.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
