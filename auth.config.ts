import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnServiceOrders = nextUrl.pathname.startsWith("/service-orders");

      if (isOnAdmin) {
        if (isLoggedIn) return role === "ADMIN";
        return false;
      }

      if (isOnServiceOrders) {
        if (isLoggedIn) {
          return ["ADMIN", "GESTOR", "INSPETOR", "OPERACIONAL"].includes(role);
        }
        return false;
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
