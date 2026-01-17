import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdminCreate = nextUrl.pathname.startsWith("/admin/create");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      
      if (isOnAdminCreate || isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // При входе сохраняем данные пользователя в токен
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl;
      }
      
      // При обновлении сессии (update()) обновляем данные из параметров
      if (trigger === "update" && session) {
        console.log("[Auth JWT] Update triggered with session data:", session);
        
        // Если переданы данные пользователя через update(), используем их
        if (session.user) {
          if (session.user.name !== undefined) {
            token.name = session.user.name;
            console.log("[Auth JWT] Updated token.name to:", session.user.name);
          }
          if ((session.user as any).username !== undefined) {
            token.username = (session.user as any).username;
            console.log("[Auth JWT] Updated token.username to:", (session.user as any).username);
          }
          if ((session.user as any).avatarUrl !== undefined) {
            token.avatarUrl = (session.user as any).avatarUrl;
            console.log("[Auth JWT] Updated token.avatarUrl to:", (session.user as any).avatarUrl);
          }
          if (session.user.email !== undefined) {
            token.email = session.user.email;
          }
        } else {
          // Если данные не переданы, загружаем из БД
          console.log("[Auth JWT] No session data, fetching from DB...");
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                avatarUrl: true,
              },
            });

            if (freshUser) {
              token.name = freshUser.name ?? undefined;
              token.username = freshUser.username ?? undefined;
              token.email = freshUser.email ?? undefined;
              token.role = freshUser.role ?? undefined;
              token.avatarUrl = freshUser.avatarUrl ?? undefined;
              console.log("[Auth JWT] Updated from DB:", freshUser.name);
            }
          } catch (error) {
            console.error("[Auth] Error fetching fresh user data:", error);
          }
        }
      }

      /**
       * Backfill missing fields for old sessions.
       * If user logged in before we started storing role/username/avatar in JWT,
       * token.role can be undefined => dashboard access will be denied.
       *
       * We only hit DB when something important is missing to avoid extra load.
       */
      const tokenUserId = (token.id as string | undefined) ?? (token.sub as string | undefined);
      const needsBackfill =
        !!tokenUserId &&
        (token.role === undefined ||
          token.email === undefined ||
          token.username === undefined ||
          token.avatarUrl === undefined ||
          token.name === undefined);

      if (needsBackfill) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: tokenUserId },
            select: {
              name: true,
              username: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          });

          if (freshUser) {
            if (token.name === undefined) token.name = freshUser.name ?? undefined;
            if (token.username === undefined) token.username = freshUser.username ?? undefined;
            if (token.email === undefined) token.email = freshUser.email ?? undefined;
            if (token.role === undefined) token.role = freshUser.role ?? undefined;
            if (token.avatarUrl === undefined) token.avatarUrl = freshUser.avatarUrl ?? undefined;
          }
        } catch (error) {
          console.error("[Auth] Error backfilling token user data:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Находим пользователя в базе данных
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        // Проверяем наличие пароля (может отсутствовать для OAuth пользователей)
        if (!user.password) {
          return null;
        }

        // Проверяем пароль
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

            return {
              id: user.id,
              email: user.email,
              name: user.name ?? undefined,
              username: user.username ?? undefined,
              role: user.role,
              avatarUrl: user.avatarUrl ?? undefined,
            };
      },
    }),
  ],
};
