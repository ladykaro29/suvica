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
        "Categoría del equipo observado en la imagen: Laptop, Celular, Radio u Otro. Si no es posible determinarlo, devuelve null.",
    },
    marcaModelo: {
      type: Type.STRING,
      nullable: true,
      description:
        "Marca y modelo del equipo (ej. 'Dell Latitude 5420', 'Samsung Galaxy A54', 'Motorola DEP450'). Si no aparece, devuelve null.",
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
        "Primer código IMEI de 15 dígitos numéricos exactos. Si no aparece, devuelve null.",
    },
    imei2: {
      type: Type.STRING,
      nullable: true,
      description:
        "Segundo código IMEI de 15 dígitos numéricos exactos (si el equipo es Dual SIM). Si no aparece, devuelve null.",
    },
    codigoInventario: {
      type: Type.STRING,
      nullable: true,
      description:
        "Código de etiqueta de activo fijo o número de serie/inventario corporativo si es visible. Si no aparece, devuelve null.",
    },
  },
  required: ["tipoEquipo", "marcaModelo", "macAddress", "imei1", "imei2"],
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
    const rawImage: string | undefined = body?.image || body?.imageBase64;

    if (!rawImage || typeof rawImage !== "string") {
      return NextResponse.json(
        { error: "Debe enviar una imagen en base64 válida." },
        { status: 400 }
      );
    }

    // Extraer mimeType y datos base64 puros si viene con prefijo data:image/...;base64,
    let mimeType = "image/jpeg";
    let base64Data = rawImage;

    const dataUrlMatch = rawImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analiza esta fotografía de un equipo tecnológico, etiqueta trasera, pantalla de información del sistema (*#06# o ajustes) o caja de inventario.
Extrae con máxima precisión los siguientes datos:
1. tipoEquipo: Clasifícalo como "Laptop", "Celular", "Radio" u "Otro".
2. marcaModelo: Marca y modelo exactos del dispositivo (ej. "Lenovo ThinkPad T14", "Motorola R7", "Xiaomi Redmi Note 13").
3. macAddress: Dirección MAC en formato estricto XX:XX:XX:XX:XX:XX (6 pares hexadecimales separados por dos puntos).
4. imei1: Código IMEI 1 (exactamente 15 dígitos numéricos).
5. imei2: Código IMEI 2 (exactamente 15 dígitos numéricos, si existe un segundo IMEI).
6. codigoInventario: Código de etiqueta de inventario/activo o serial si está visible.

Regla estricta: Si alguno de los datos NO es visible o no aparece en la imagen, devuelve null en ese campo. No inventes valores.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "El modelo no devolvió respuesta para la imagen enviada." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(text);

    const resultado = {
      tipoEquipo: ["Laptop", "Celular", "Radio", "Otro"].includes(parsed.tipoEquipo)
        ? parsed.tipoEquipo
        : null,
      marcaModelo:
        typeof parsed.marcaModelo === "string" && parsed.marcaModelo.trim() !== ""
          ? parsed.marcaModelo.trim()
          : null,
      macAddress: normalizeMacAddress(parsed.macAddress),
      imei1: normalizeImei(parsed.imei1),
      imei2: normalizeImei(parsed.imei2),
      codigoInventario:
        typeof parsed.codigoInventario === "string" &&
        parsed.codigoInventario.trim() !== ""
          ? parsed.codigoInventario.trim()
          : null,
    };

    return NextResponse.json(resultado);
  } catch (error: unknown) {
    console.error("Error en /api/analizar-foto:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error procesando la imagen con Gemini IA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

