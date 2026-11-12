export const SESSION_COOKIE_NAME = "suvica_auth_session";

export function getExpectedCredentials() {
  const validUser = (process.env.APP_USER || "admin").trim().toLowerCase();
  const validPassword = (process.env.APP_PASSWORD || "suvica2026").trim();
  return { validUser, validPassword };
}

export function createSessionToken(username: string): string {
  const { validPassword } = getExpectedCredentials();
  const raw = `${username.toLowerCase()}:${validPassword}:suvica-secret-v1`;
  // Codificación simple compatible con Edge Runtime y Node.js
  return typeof btoa === "function"
    ? btoa(unescape(encodeURIComponent(raw)))
    : Buffer.from(raw, "utf-8").toString("base64");
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const { validUser } = getExpectedCredentials();
  const expectedPrimary = createSessionToken(validUser);
  const expectedSuvica = createSessionToken("suvica");
  return token === expectedPrimary || token === expectedSuvica;
}
