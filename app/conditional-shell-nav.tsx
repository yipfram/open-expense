"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export function ConditionalShellNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const activeView = requestedView === "finance" ? "finance" : "member";
  const hideGlobalNav = pathname === "/app" && (activeView === "member" || activeView === "finance");

  return <div className={hideGlobalNav ? "hidden" : undefined}>{children}</div>;
}
