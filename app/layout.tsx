import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BurgerMenu } from "@/app/burger-menu";
import { PerformanceGuard } from "@/app/performance-guard";

export const metadata: Metadata = {
  title: "Open-expense",
  description: "Self-hosted expense collection app",
  manifest: "/manifest.webmanifest",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden">
        <PerformanceGuard />
        <BurgerMenu />
        {children}
      </body>
    </html>
  );
}
