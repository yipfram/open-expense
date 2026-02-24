import type { MetadataRoute } from "next";
import { WORKSPACE_PATH } from "@/src/lib/routes";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Open-expense",
    short_name: "OpenExpense",
    description: "Open-source expense collection app",
    id: WORKSPACE_PATH,
    start_url: WORKSPACE_PATH,
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
