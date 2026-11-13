import crypto from "crypto";

export const SESSION_COOKIE_NAME = "suvica_auth_session";

export function getExpectedCredentials() {
  const validUser = (process.env.APP_USER || "admin").trim().toLowerCase();
  const validPassword = (process.env.APP_PASSWORD || "suvica2026").trim();
  const secretKey = (
    process.env.APP_SECRET ||
    process.env.SESSION_SECRET ||
    `${validPassword}_suvica_secret_key_v2`
  ).trim();
  return { validUser, validPassword, secretKey };
}

/**
 * Genera una firma HMAC-SHA256 para proteger el contenido de la sesión contra manipulaciones
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Comparación de cadenas de tiempo constante para evitar ataques de canal lateral (Timing Attacks)
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf-8"), Buffer.from(b, "utf-8"));
  } catch {
    return false;
  }
}

/**
 * Crea un token de sesión criptográficamente firmado con expiración (7 días)
 * NO almacena la contraseña en texto claro ni en base64 simple.
 */
export function createSessionToken(username: string): string {
  const { secretKey } = getExpectedCredentials();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 días
  const payload = JSON.stringify({
    u: username.toLowerCase().trim(),
    exp: expiresAt,
  });

  const payloadBase64 = Buffer.from(payload, "utf-8").toString("base64url");
  const signature = signPayload(payloadBase64, secretKey);

  return `${payloadBase64}.${signature}`;
}

/**
 * Valida la autenticidad y vigencia del token de sesión.
 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== "string") return false;

  const { validUser, secretKey, validPassword } = getExpectedCredentials();

  // 1. Verificación del nuevo formato firmado: payload.signature
  if (token.includes(".")) {
    const [payloadBase64, providedSignature] = token.split(".");
    if (!payloadBase64 || !providedSignature) return false;

    const expectedSignature = signPayload(payloadBase64, secretKey);
    if (!constantTimeCompare(providedSignature, expectedSignature)) {
      return false;
    }

    try {
      const decodedJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
      const data = JSON.parse(decodedJson);

      // Verificar vigencia (expiración)
      if (typeof data.exp === "number" && Date.now() > data.exp) {
        return false;
      }

      // Verificar que pertenezca a un usuario válido
      const username = String(data.u || "").toLowerCase();
      return username === validUser || username === "suvica" || username === "admin";
    } catch {
      return false;
    }
  }

  // 2. Compatibilidad retroactiva con tokens legados en base64 simple
  // Permite que las sesiones ya iniciadas no se desconecten abruptamente durante el despliegue
  try {
    const rawExpectedPrimary = `${validUser}:${validPassword}:suvica-secret-v1`;
    const rawExpectedSuvica = `suvica:${validPassword}:suvica-secret-v1`;
    const tokenExpectedPrimary = Buffer.from(rawExpectedPrimary, "utf-8").toString("base64");
    const tokenExpectedSuvica = Buffer.from(rawExpectedSuvica, "utf-8").toString("base64");

    if (token === tokenExpectedPrimary || token === tokenExpectedSuvica) {
      return true;
    }
  } catch {
    // Si falla, rechazar
  }

  return false;
}

/**
 * Comprueba de forma segura si la contraseña suministrada coincide con la configurada
 */
export function verifyPassword(provided: string, expected: string): boolean {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  return constantTimeCompare(provided.trim(), expected.trim());
}
