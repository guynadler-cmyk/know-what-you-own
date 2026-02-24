import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });

const adminAuth = getAuth(firebaseApp);

async function verifyToken(token: string) {
  return adminAuth.verifyIdToken(token);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.get("/api/auth/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const token = authHeader.split("Bearer ")[1];
      const decoded = await verifyToken(token);
      return res.json({
        sub: decoded.uid,
        email: decoded.email || null,
        first_name: decoded.name?.split(" ")[0] || null,
        last_name: decoded.name?.split(" ").slice(1).join(" ") || null,
        profile_image_url: decoded.picture || null,
      });
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  });

  app.post("/api/auth/sync", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    let decoded;
    try {
      const token = authHeader.split("Bearer ")[1];
      decoded = await verifyToken(token);
    } catch (authErr) {
      console.error("[auth/sync] Token verification failed:", authErr);
      return res.status(401).json({ message: "Invalid token" });
    }
    try {
      const existingUser = await storage.getUser(decoded.uid);
      const isNewUser = !existingUser;

      await storage.upsertUser({
        id: decoded.uid,
        email: decoded.email || null,
        firstName: decoded.name?.split(" ")[0] || null,
        lastName: decoded.name?.split(" ").slice(1).join(" ") || null,
        profileImageUrl: decoded.picture || null,
      });

      let isNewLead = false;
      if (isNewUser && decoded.email) {
        isNewLead = await storage.isEmailNew(decoded.email);
        console.log(`[auth/sync] New user created: ${decoded.uid} (${decoded.email}) isNewLead: ${isNewLead}`);
      } else {
        console.log(`[auth/sync] User synced: ${decoded.uid} (${decoded.email || "no email"})`);
      }

      return res.json({ ok: true, isNewUser, isNewLead });
    } catch (dbErr) {
      console.error("[auth/sync] Database upsert failed for user", decoded.uid, ":", dbErr);
      return res.status(500).json({ message: "Failed to save user" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await verifyToken(token);
    req.user = {
      claims: {
        sub: decoded.uid,
        email: decoded.email || null,
        name: decoded.name || null,
        picture: decoded.picture || null,
      },
    };

    try {
      await storage.upsertUser({
        id: decoded.uid,
        email: decoded.email || null,
        firstName: decoded.name?.split(" ")[0] || null,
        lastName: decoded.name?.split(" ").slice(1).join(" ") || null,
        profileImageUrl: decoded.picture || null,
      });
    } catch (upsertErr) {
      console.error("[auth] Background user upsert failed:", upsertErr);
    }

    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
