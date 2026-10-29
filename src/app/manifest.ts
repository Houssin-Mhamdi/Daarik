import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daarik · A taste of home",
    short_name: "Daarik",
    description:
      "Homemade Arabic food from home cooks in your city. Pre-order, pick up, enjoy.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF6EF",
    theme_color: "#C85A32",
    lang: "nl",
    dir: "ltr",
    categories: ["food", "shopping", "lifestyle"],
    icons: [
      {
        src: "/img/daarik-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
