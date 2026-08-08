import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { useGinkgo } from "@/state/ginkgo-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Ginkgo" },
      { name: "description", content: "Configure the AI provider, map basemap and analysis defaults for Ginkgo." },
      { property: "og:title", content: "Settings — Ginkgo" },
      { property: "og:description", content: "Configure the AI provider, map basemap and analysis defaults for Ginkgo." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { aiProviderName, layers, setLayer } = useGinkgo();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Provider configuration and workspace defaults." />
      <div className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-2">
        <div className="ginkgo-panel px-4 py-4">
          <h2 className="text-[13.5px] font-semibold">AI Provider</h2>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            Currently running the <span className="font-medium text-foreground">{aiProviderName}</span> spatial
            reasoning provider. The provider layer is abstracted, so a hosted model can be connected later without
            changing the interface.
          </p>
        </div>
        <div className="ginkgo-panel px-4 py-4">
          <h2 className="text-[13.5px] font-semibold">Default Layers</h2>
          <div className="mt-2.5 space-y-2">
            {Object.entries(layers).map(([id, on]) => (
              <label key={id} className="flex items-center justify-between text-[12.5px] capitalize">
                {id}
                <input type="checkbox" checked={on} onChange={(e) => setLayer(id, e.target.checked)} />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
