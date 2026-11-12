import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SUVICA - Captura de Inventario IA",
    short_name: "Inventario IA",
    description:
      "Aplicación móvil PWA para recolección rápida de inventario de equipos (Laptops, Celulares y Radios) mediante fotografía con IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

