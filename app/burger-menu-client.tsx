"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { signOutAction } from "@/app/actions";

type BurgerMenuItem = {
  href: string;
  label: string;
};

type BurgerMenuClientProps = {
  items: BurgerMenuItem[];
  isAuthenticated: boolean;
};

export function BurgerMenuClient({ items, isAuthenticated }: BurgerMenuClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-x-0 top-4 z-50 mx-auto w-full max-w-5xl px-4 sm:px-6">
      <button
        type="button"
        className="ml-auto flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="global-burger-menu"
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div
          id="global-burger-menu"
          className="absolute right-4 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg sm:right-6"
          role="menu"
          aria-label="Global navigation"
        >
          <nav className="grid gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                className="rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
                href={item.href}
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <div className="my-1 h-px bg-slate-200" />
                <form action={signOutAction}>
                  <button
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                    type="submit"
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
