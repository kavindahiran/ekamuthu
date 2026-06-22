import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Edge-compatible config: no Prisma, no pg, no heavy Node.js modules.
// Used by proxy.ts (middleware). The authorize fn here is a stub — real
// credential validation happens in auth.ts which runs only in Node.js runtime.
export const authConfig = {
  providers: [
    Google({ clientId: "", clientSecret: "" }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async () => null,
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "GUEST";
        session.user.phoneVerified = (token.phoneVerified as boolean) ?? false;
        session.user.isHostEligible = (token.isHostEligible as boolean) ?? false;
        session.user.idVerificationStatus =
          (token.idVerificationStatus as string) ?? "UNVERIFIED";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
