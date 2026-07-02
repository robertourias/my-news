import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { SITE } from "@/lib/config";
import { consumeCode } from "@/lib/auth/otp-store";

const credentialsSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        code: {},
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, code } = parsed.data;
        const authEmail = process.env.AUTH_EMAIL?.toLowerCase();
        if (!authEmail || email !== authEmail) return null;

        if (!consumeCode(email, code)) return null;

        return { name: SITE.userName, email };
      },
    }),
  ],
});
