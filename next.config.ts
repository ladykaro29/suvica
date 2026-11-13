import type { NextConfig } from "next";

const securityHeaders = [
  // Previene que la aplicación sea embebida en un iframe malicioso externo (Anti-Clickjacking)
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Previene que el navegador intente adivinar el tipo MIME de los archivos (Anti-MIME Sniffing)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Control estricto de información enviada en el encabezado Referer
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Protección XSS en navegadores
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Restringe el acceso a la cámara exclusivamente al propio dominio para escaneo de fotos y QR
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
