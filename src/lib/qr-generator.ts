import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Genera un Data URL en formato PNG (base64) para renderizar en etiquetas o descargar
 */
export async function generateQRDataUrl(
  text: string,
  options?: QRCodeOptions
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width ?? 220,
    margin: options?.margin ?? 1,
    errorCorrectionLevel: options?.errorCorrectionLevel ?? "M",
    color: {
      dark: "#0f172a", // Slate-900 para máximo contraste en escáneres
      light: "#ffffff",
    },
  });
}

/**
 * Genera un SVG string vectorial puro para impresión de altísima nitidez
 */
export async function generateQRSvg(
  text: string,
  options?: QRCodeOptions
): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: options?.width ?? 220,
    margin: options?.margin ?? 1,
    errorCorrectionLevel: options?.errorCorrectionLevel ?? "M",
  });
}

