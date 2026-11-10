import type { RequestHandler } from "express";
import { createHash } from "node:crypto";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { and, eq, gt, lte } from "drizzle-orm";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const sessionToken = req.cookies?.session;

  if (!sessionToken) {
    return res.status(401).json({ error: "Not Authorized" });
  }

  const sessionIDHash = createHash("sha256").update(sessionToken).digest("hex");
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionIDHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    // Remove this session if it exists but has expired
    await db
      .delete(sessions)
      .where(and(eq(sessions.id, sessionIDHash), lte(sessions.expiresAt, new Date())));
    return res.status(401).json({ error: "Not Authorized" });
  }

  req.user = row;

  next();
};
