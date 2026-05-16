import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "";

// Create client eagerly — before any component renders — so ConvexProvider
// is always mounted on the first render and useQuery never crashes.
const convexClient = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

export function getConvexClient(): ConvexReactClient | null {
  return convexClient;
}

export function isConvexConfigured(): boolean {
  return Boolean(CONVEX_URL);
}

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  if (!convexClient) {
    // No VITE_CONVEX_URL set — render without provider (localStorage fallback)
    return <>{children}</>;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
