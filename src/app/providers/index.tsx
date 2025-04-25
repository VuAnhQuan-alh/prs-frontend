"use client";

import { MantineProviders } from "./mantine-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <MantineProviders>{children}</MantineProviders>;
}
