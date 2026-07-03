import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Nav() {
  const session = await auth();

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-3 text-sm">
      {session?.user ? (
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="flex items-center gap-3"
        >
          <span className="text-secondary">{session.user.name}</span>
          <button
            type="submit"
            className="rounded-full border border-card-border bg-surface px-3.5 py-1.5 text-xs text-secondary transition-colors hover:text-foreground"
          >
            Sair
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className="rounded-full border border-card-border bg-surface px-3.5 py-1.5 text-xs text-secondary transition-colors hover:text-foreground"
        >
          Entrar
        </Link>
      )}
    </div>
  );
}
