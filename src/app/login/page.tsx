import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY não configurada");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-5 py-20">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-1 text-sm text-secondary">
          Acesso restrito. Informe seu email para receber um código.
        </p>
      </div>
      <LoginForm turnstileSiteKey={siteKey} />
    </main>
  );
}
