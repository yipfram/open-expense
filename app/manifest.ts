import type { MetadataRoute } from "next";
import { WORKSPACE_PATH } from "@/src/lib/routes";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Open-expense",
    short_name: "Open-expense",
    description: "Mobile-first expense submission",
    start_url: WORKSPACE_PATH,
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
  };
}
