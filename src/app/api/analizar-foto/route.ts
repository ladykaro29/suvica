import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tipoEquipo: {
      type: Type.STRING,
      enum: ["Laptop", "Celular", "Radio", "Otro"],
      nullable: true,
    },
    marcaModelo: {
      type: Type.STRING,
      nullable: true,
    },
    serial: {
      type: Type.STRING,
      nullable: true,
    },
    especificaciones: {
      type: Type.STRING,
      nullable: true,
    },
    macAddress: {
      type: Type.STRING,
      nullable: true,
    },
    imei1: {
      type: Type.STRING,
      nullable: true,
    },
    imei2: {
      type: Type.STRING,
      nullable: true,
    },
    codigoInventario: {
      type: Type.STRING,
      nullable: true,
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

const globalGeminiCache = globalThis as unknown as {
  preferredGeminiModel?: string;
};

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
      ? body.images.filter(
          (img: unknown): img is string =>
            typeof img === "string" && img.length > 0
        )
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

    // Prompt directo y compacto para reducir latencia al mínimo
    const prompt = `Extrae los datos del dispositivo tecnológico en ${
      imageParts.length === 1
        ? "la foto"
        : `estas ${imageParts.length} fotos del mismo equipo (unifica lo visible en todas)`
    }:
- tipoEquipo: "Laptop", "Celular", "Radio" u "Otro".
- marcaModelo: Marca y modelo exactos.
- serial: S/N, Serial Number, Service Tag o MEID.
- especificaciones: CPU/RAM/Disco/P-N (Laptop), Banda UHF-VHF/MHz/Modelo técnico (Radio), GB/RAM/Modelo técnico (Celular).
- macAddress: MAC en formato XX:XX:XX:XX:XX:XX.
- imei1, imei2: IMEI de 15 dígitos (SOLO si es Celular; para Laptop y Radio devuelve null).
- codigoInventario: Código de etiqueta de activo si aparece.
Si un dato no es visible, devuelve null.`;

    // Priorizar los modelos Flash Lite y Flash más veloces (y recordar en caché el que responda primero)
    const baseCandidates = [
      process.env.GEMINI_MODEL,
      globalGeminiCache.preferredGeminiModel,
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3-flash-preview",
    ].filter((m): m is string => Boolean(m));

    const candidateModels = Array.from(new Set(baseCandidates));

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
            temperature: 0,
            // Desactivar "thinking" interno para respuesta instantánea en OCR/JSON (~1.5s en vez de ~9s)
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          globalGeminiCache.preferredGeminiModel = modelName;
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(
          `Modelo ${modelName} no disponible o sin thinkingConfig, probando siguiente...`
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
