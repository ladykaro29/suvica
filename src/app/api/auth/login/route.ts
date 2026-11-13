import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getExpectedCredentials,
  verifyPassword,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

// Almacén en memoria de intentos fallidos por IP para mitigar ataques de fuerza bruta
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
  lastAttempt: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos de bloqueo tras 5 intentos fallidos
const WINDOW_MS = 15 * 60 * 1000; // Ventana de seguimiento

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

function checkRateLimit(ip: string): { allowed: boolean; remainingMinutes?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) return { allowed: true };

  // Si está bloqueado actualmente
  if (record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, remainingMinutes };
  }

  // Si la ventana expiró, reiniciar
  if (now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function registerFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || {
    attempts: 0,
    blockedUntil: 0,
    lastAttempt: now,
  };

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    console.warn(
      `[SEGURIDAD] IP ${ip} bloqueada por ${BLOCK_DURATION_MS / 60000} minutos tras ${MAX_ATTEMPTS} intentos fallidos.`
    );
  }

  loginAttempts.set(ip, record);
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Verificar si la IP está bloqueada por exceso de intentos fallidos
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Acceso temporalmente bloqueado por seguridad tras múltiples intentos fallidos. Por favor espera ${rateCheck.remainingMinutes} minuto(s) antes de intentar nuevamente.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Debes ingresar tu usuario y contraseña." },
        { status: 400 }
      );
    }

    const { validUser, validPassword } = getExpectedCredentials();

    // Validar usuario permitido
    const isUserValid =
      username === validUser || username === "suvica" || username === "admin";
    // Validar contraseña con comparación de tiempo constante (anti-timing attack)
    const isPasswordValid = verifyPassword(password, validPassword);

    if (!isUserValid || !isPasswordValid) {
      registerFailedAttempt(ip);
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    // Éxito: limpiar intentos previos
    clearAttempts(ip);

    // Crear token criptográficamente firmado
    const token = createSessionToken(username);
    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      ok: true,
      user: username,
      defaultPasswordWarning:
        validPassword === "suvica2026"
          ? "AVISO: Se está usando la clave predeterminada. Configura la variable APP_PASSWORD en EasyPanel para máxima seguridad."
          : null,
    });

    // Configurar cookie de sesión blindada (HttpOnly + Secure en producción + SameSite Lax)
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error("Error en POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "Error al procesar el inicio de sesión." },
      { status: 500 }
    );
  }
}
