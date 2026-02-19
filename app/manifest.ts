import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Open-expense",
    short_name: "Open-expense",
    description: "Mobile-first expense submission",
    start_url: "/member",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
  };
}
