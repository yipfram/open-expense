"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { signOutAction } from "@/app/actions";
import type { WorkspaceNavItem } from "@/src/lib/workspace-nav";

type WorkspaceMenuProps = {
  items: WorkspaceNavItem[];
};

export function WorkspaceMenu({ items }: WorkspaceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const navigationItems = items.filter((item) => item.key !== "signout");
  const hasNavigationItems = navigationItems.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-900 hover:bg-slate-50"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="workspace-menu-panel"
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div
          id="workspace-menu-panel"
          className="absolute right-0 top-full z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-2 shadow-lg sm:w-72"
          role="menu"
          aria-label="Workspace navigation"
        >
          {hasNavigationItems ? (
            <nav className="grid gap-1" aria-label="Workspace sections">
              {navigationItems.map((item) =>
                item.href ? (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm ${
                      item.active ? "bg-slate-900 text-white" : "text-slate-800 hover:bg-slate-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                  >
                    {item.label}
                  </Link>
                ) : null,
              )}
            </nav>
          ) : null}

          <div className="my-2 h-px bg-slate-200" />

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
