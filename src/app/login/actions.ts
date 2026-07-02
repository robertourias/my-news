"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { issueCode } from "@/lib/auth/otp-store";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { sendOtpEmail } from "@/lib/email/resend";

const GENERIC_ERROR = "Não foi possível processar. Tente novamente em instantes.";
const emailSchema = z.string().email();
const codeSchema = z.string().length(6);

export interface SendCodeState {
  ok: boolean;
  error?: string;
}

export async function sendCodeAction(
  _prev: SendCodeState,
  formData: FormData
): Promise<SendCodeState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  const token = formData.get("cf-turnstile-response");

  if (!parsedEmail.success || typeof token !== "string" || !token) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const isHuman = await verifyTurnstile(token);
  if (!isHuman) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const email = parsedEmail.data.toLowerCase();

  if (isRateLimited(email)) {
    return { ok: false, error: "Aguarde um pouco antes de pedir um novo código." };
  }

  // Resposta sempre genérica — não revela se o email é ou não autorizado.
  const authEmail = process.env.AUTH_EMAIL?.toLowerCase();
  if (email === authEmail) {
    const code = issueCode(email);
    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      console.error("[auth] falha ao enviar código:", err);
    }
  }

  return { ok: true };
}

export interface VerifyCodeState {
  ok: boolean;
  error?: string;
}

export async function verifyCodeAction(
  _prev: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  const parsedCode = codeSchema.safeParse(formData.get("code"));

  if (!parsedEmail.success || !parsedCode.success) {
    return { ok: false, error: GENERIC_ERROR };
  }

  try {
    await signIn("credentials", {
      email: parsedEmail.data.toLowerCase(),
      code: parsedCode.data,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Código inválido ou expirado." };
    }
    throw err;
  }

  redirect("/");
}
