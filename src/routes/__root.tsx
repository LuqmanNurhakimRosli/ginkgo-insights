import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Compass, RotateCcw } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { GinkgoProvider } from "@/state/ginkgo-store";
import { AppShell } from "@/components/layout/AppShell";
import { btn, EmptyState } from "@/components/gk/ui";

function NotFoundComponent() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={<Compass className="h-5 w-5" />}
        title="Page not found"
        body="This page does not exist. Return to the map workspace to continue."
        actions={
          <Link to="/" className={btn.primary}>
            Back to map
          </Link>
        }
      />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={<RotateCcw className="h-5 w-5" />}
        title="Something went wrong"
        body="This view failed to load. Your saved areas are stored locally and are not affected."
        actions={
          <>
            <button
              className={btn.primary}
              onClick={() => {
                void router.invalidate();
                reset();
              }}
            >
              Try again
            </button>
            <a href="/" className={btn.secondary}>
              Back to map
            </a>
          </>
        }
      />
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#090a0c" },
      { title: "Ginkgo — Spatial Decision Intelligence" },
      {
        name: "description",
        content:
          "Ginkgo screens any area in Malaysia for riverine flood susceptibility, land use, accessibility and development suitability using open elevation and OpenStreetMap data.",
      },
      { name: "author", content: "Ginkgo" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Ginkgo — Spatial Decision Intelligence" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://server.arcgisonline.com" },
      { rel: "preconnect", href: "https://s3.amazonaws.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <GinkgoProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </GinkgoProvider>
    </QueryClientProvider>
  );
}
