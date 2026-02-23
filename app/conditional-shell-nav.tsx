"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ConditionalShellNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideGlobalNav = pathname === "/app";

  return <div className={hideGlobalNav ? "hidden" : undefined}>{children}</div>;
}
