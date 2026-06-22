import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut, unstable_update: update } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" },

  // Override the stub Credentials provider with the real one (runs in Node.js only)
  providers: [
    ...authConfig.providers.filter((p) => p.id !== "credentials"),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              passwordHash: true,
            },
          });

          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatarUrl,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            phoneVerified: true,
            isHostEligible: true,
            idVerificationStatus: true,
          },
        });
        token.id = user.id;
        token.role = dbUser?.role;
        token.phoneVerified = dbUser?.phoneVerified;
        token.isHostEligible = dbUser?.isHostEligible;
        token.idVerificationStatus = dbUser?.idVerificationStatus;
      }
      return token;
    },
    async session({ session, token }) {
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
});
