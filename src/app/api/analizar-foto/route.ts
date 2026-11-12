import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tipoEquipo: {
      type: Type.STRING,
      enum: ["Laptop", "Celular", "Radio", "Otro"],
      nullable: true,
      description:
        "Categoría del equipo observado en las imágenes: Laptop, Celular, Radio u Otro. Si no es posible determinarlo, devuelve null.",
    },
    marcaModelo: {
      type: Type.STRING,
      nullable: true,
      description:
        "Marca y modelo completo del equipo combinando lo visible en todas las fotos (ej. 'Dell Latitude 5420', 'Samsung Galaxy A54 (SM-A546E)', 'Motorola DEP450'). Si no aparece, devuelve null.",
    },
    serial: {
      type: Type.STRING,
      nullable: true,
      description:
        "Número de serie (S/N, Serial Number, Service Tag o SSN) del dispositivo. Muy común en etiquetas de Laptops, Radios y Celulares. Si no aparece, devuelve null.",
    },
    especificaciones: {
      type: Type.STRING,
      nullable: true,
      description:
        "Información técnica adicional visible combinada de todas las fotos según el tipo de equipo: en Laptops (Procesador, RAM, SSD, Voltaje/Amperaje, Product Number); en Radios (Banda UHF/VHF, Rango de frecuencia MHz, FCC ID, Tipo/Modelo técnico); en Celulares (Capacidad GB, RAM, Modelo técnico, Número telefónico o SIM si aparece); en Otros (Especificaciones visibles). Si no hay datos adicionales, devuelve null.",
    },
    macAddress: {
      type: Type.STRING,
      nullable: true,
      description:
        "Dirección MAC Wi-Fi / Ethernet / Bluetooth en formato estricto XX:XX:XX:XX:XX:XX en mayúsculas. Si no aparece, devuelve null.",
    },
    imei1: {
      type: Type.STRING,
      nullable: true,
      description:
        "Primer código IMEI de 15 dígitos numéricos exactos (SOLO aplica si el equipo es Celular o tiene módem celular; para Laptops y Radios devuelve null).",
    },
    imei2: {
      type: Type.STRING,
      nullable: true,
      description:
        "Segundo código IMEI de 15 dígitos numéricos exactos (SOLO si es un Celular Dual SIM; para Laptops y Radios devuelve null).",
    },
    codigoInventario: {
      type: Type.STRING,
      nullable: true,
      description:
        "Código de etiqueta de activo fijo o inventario corporativo si es visible en cualquiera de las fotos. Si no aparece, devuelve null.",
    },
  },
  required: [
    "tipoEquipo",
    "marcaModelo",
    "serial",
    "especificaciones",
    "macAddress",
    "imei1",
    "imei2",
  ],
};

function normalizeMacAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleanHex = raw.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  if (cleanHex.length === 12) {
    return cleanHex.match(/.{1,2}/g)!.join(":");
  }
  const trimmed = raw.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeImei(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 15) {
    return digits;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBase64Image(rawImage: string): {
  mimeType: string;
  data: string;
} {
  let mimeType = "image/jpeg";
  let base64Data = rawImage;

  const dataUrlMatch = rawImage.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
  );
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  }
  return { mimeType, data: base64Data };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Falta configurar la variable de entorno GEMINI_API_KEY en el servidor.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Soportar múltiples imágenes (`images: string[]`) o una sola imagen (`image: string`)
    const rawImagesList: string[] = Array.isArray(body?.images)
      ? body.images.filter((img: unknown): img is string => typeof img === "string" && img.length > 0)
      : typeof body?.image === "string" && body.image.length > 0
      ? [body.image]
      : typeof body?.imageBase64 === "string" && body.imageBase64.length > 0
      ? [body.imageBase64]
      : [];

    if (rawImagesList.length === 0) {
      return NextResponse.json(
        { error: "Debe enviar al menos una imagen en base64 válida." },
        { status: 400 }
      );
    }

    const imageParts = rawImagesList.slice(0, 8).map((img) => {
      const parsedImg = parseBase64Image(img);
      return {
        inlineData: {
          mimeType: parsedImg.mimeType,
          data: parsedImg.data,
        },
      };
    });

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analiza ${
      imageParts.length === 1
        ? "esta fotografía"
        : `estas ${imageParts.length} fotografías que corresponden AL MISMO DISPOSITIVO tecnológico (por ejemplo: una foto puede mostrar la pantalla *#06# con los IMEI, otra foto la pantalla de Ajustes con la Dirección MAC o el modelo, y otra foto la etiqueta trasera con el Serial S/N o código de activo)`
    }.
Combina y unifica toda la información encontrada en todas las imágenes para devolver un único registro completo del dispositivo adaptándote a su categoría:
1. tipoEquipo: Clasifícalo como "Laptop", "Celular", "Radio" u "Otro".
2. marcaModelo: Marca y modelo completos del dispositivo unificando lo visto en las fotos (ej. "Lenovo ThinkPad T14 Gen 2", "Motorola MOTOTRBO R7", "Samsung Galaxy A54 5G").
3. serial: Número de Serie (S/N, Serial No., Service Tag, MEID/SN). Es indispensable en Laptops, Radios y etiquetas/pantallas de Celulares.
4. especificaciones: Recolecta y combina las características técnicas propias de ese tipo de dispositivo visibles en cualquiera de las fotos:
   - Si es Laptop: Procesador (CPU), RAM, Disco, Número de Parte (P/N o MTM), Voltaje/Amperaje (ej. 20V 3.25A), Windows/OS.
   - Si es Radio: Banda (UHF / VHF), Rango de Frecuencia (MHz), Potencia (W), Código de Modelo técnico (ej. AAH01QDC9JA2AN), FCC ID, Batería.
   - Si es Celular: Modelo técnico (ej. SM-A546E/DS), Almacenamiento/RAM, Dual SIM, Operadora.
   - Si es Otro: Tipo de equipo específico (Monitor, Impresora, Router, Tablet) y sus datos técnicos visibles.
5. macAddress: Dirección MAC Wi-Fi / Ethernet / Bluetooth en formato estricto XX:XX:XX:XX:XX:XX.
6. imei1 e imei2: Códigos IMEI de 15 dígitos numéricos. IMPORTANTE: Las Laptops y los Radios VHF/UHF NO tienen IMEI; para ellos devuelve siempre null en imei1 e imei2.
7. codigoInventario: Código de etiqueta de activo fijo o inventario corporativo si está visible en alguna de las fotos.

Regla estricta: Si un dato no aparece en ninguna de las imágenes, devuelve null en ese campo. No inventes valores.`;

    // Cadena de modelos Gemini 3.x activos y verificados con respaldo automático
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
    ].filter((m): m is string => Boolean(m));

    let responseText: string | undefined;
    let lastError: unknown;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, ...imageParts],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.1,
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(
          `Modelo ${modelName} no disponible temporalmente, probando respaldo...`
        );
      }
    }

    if (!responseText) {
      throw (
        lastError ||
        new Error("El modelo de IA no devolvió respuesta para las imágenes.")
      );
    }

    const parsed = JSON.parse(responseText);
    const tipoDetectado = ["Laptop", "Celular", "Radio", "Otro"].includes(
      parsed.tipoEquipo
    )
      ? parsed.tipoEquipo
      : null;

    // Las Laptops, Radios y Otros no usan IMEI celular
    const permiteImei = !tipoDetectado || tipoDetectado === "Celular";

    const resultado = {
      tipoEquipo: tipoDetectado,
      marcaModelo:
        typeof parsed.marcaModelo === "string" &&
        parsed.marcaModelo.trim() !== ""
          ? parsed.marcaModelo.trim()
          : null,
      serial:
        typeof parsed.serial === "string" && parsed.serial.trim() !== ""
          ? parsed.serial.trim().toUpperCase()
          : null,
      especificaciones:
        typeof parsed.especificaciones === "string" &&
        parsed.especificaciones.trim() !== ""
          ? parsed.especificaciones.trim()
          : null,
      macAddress: normalizeMacAddress(parsed.macAddress),
      imei1: permiteImei ? normalizeImei(parsed.imei1) : null,
      imei2: permiteImei ? normalizeImei(parsed.imei2) : null,
      codigoInventario:
        typeof parsed.codigoInventario === "string" &&
        parsed.codigoInventario.trim() !== ""
          ? parsed.codigoInventario.trim()
          : null,
      fotosAnalizadas: imageParts.length,
    };

    return NextResponse.json(resultado);
  } catch (error: unknown) {
    console.error("Error en /api/analizar-foto:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error procesando las imágenes con Gemini IA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
