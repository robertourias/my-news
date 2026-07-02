import { randomInt } from "node:crypto";

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const OTP_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

const store = new Map<string, OtpEntry>();

/** Gera e guarda um código de 6 dígitos para o email (uso único, expira em 10min). */
export function issueCode(email: string): string {
  const code = randomInt(100000, 1000000).toString();
  store.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  return code;
}

/**
 * Confere o código. Retorna true e invalida a entrada se corresponder.
 * 5 tentativas erradas ou expiração invalidam a entrada.
 */
export function consumeCode(email: string, code: string): boolean {
  const entry = store.get(email);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }

  if (entry.code !== code) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) store.delete(email);
    return false;
  }

  store.delete(email);
  return true;
}
