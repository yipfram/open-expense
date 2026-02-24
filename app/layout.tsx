import "./globals.css";
import "react-medium-image-zoom/dist/styles.css";

import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { PerformanceGuard } from "@/app/performance-guard";
import { PwaRegistration } from "@/app/pwa-registration";

export const metadata: Metadata = {
  title: "Open-expense",
  description: "Self-hosted expense collection app",
  applicationName: "Open-expense",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open-expense",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden">
        <PerformanceGuard />
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
