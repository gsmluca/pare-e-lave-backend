import { COOKIE_NAME, ONE_YEAR_MS } from "./constants";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

// Credenciais de acesso local (para desenvolvimento)
const LOCAL_CREDENTIALS = {
  username: "EDMATOS",
  password: "deusefiel",
};

export function registerAuthRoutes(app: Express) {
  // Rota de login local
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password, rememberMe } = req.body;

      // Validar credenciais
      if (username !== LOCAL_CREDENTIALS.username || password !== LOCAL_CREDENTIALS.password) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }

      // Criar ou obter usuário
      let user = await db.getUserByOpenId("local_user");
      
      if (!user) {
        await db.upsertUser({
          openId: "local_user",
          name: "EDMATOS",
          email: "admin@pareelave.local",
          loginMethod: "local",
          lastSignedIn: new Date(),
          role: "admin",
        });
        user = await db.getUserByOpenId("local_user");
      } else {
        // Atualizar último login
        await db.upsertUser({
          openId: "local_user",
          lastSignedIn: new Date(),
        });
      }

      if (!user) {
        res.status(500).json({ error: "Erro ao criar sessão" });
        return;
      }

      // Criar token de sessão
      const expiresInMs = rememberMe ? ONE_YEAR_MS : 7 * 24 * 60 * 60 * 1000; // 1 ano ou 7 dias
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "Usuário",
        expiresInMs,
      });

      // Definir cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: expiresInMs,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // Rota de logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      res.status(500).json({ error: "Erro ao fazer logout" });
    }
  });
}
