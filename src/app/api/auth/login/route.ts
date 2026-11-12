import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getExpectedCredentials,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();

    const { validUser, validPassword } = getExpectedCredentials();

    // Permitir el usuario configurado (por defecto "admin") o "suvica"
    const isUserValid = username === validUser || username === "suvica";
    const isPasswordValid = password === validPassword;

    if (!isUserValid || !isPasswordValid) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);
    const response = NextResponse.json({ ok: true, user: username });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Error al procesar el inicio de sesión." },
      { status: 500 }
    );
  }
}
