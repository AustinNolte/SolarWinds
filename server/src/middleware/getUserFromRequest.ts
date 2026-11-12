import type { Request } from "express";
import type { User } from "shared";
import { createHash } from "node:crypto";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { and, eq, gt } from "drizzle-orm";

// Looks up the session cookie and resolves it to a user, or undefined.
// Shared by requireAuth (middleware), authed (wrapper), and the WS handshake.
export async function getUserFromRequest(req: Request): Promise<User | undefined> {
  const sessionToken = req.cookies?.session;
  if (!sessionToken) return undefined;

  const sessionIDHash = createHash("sha256").update(sessionToken).digest("hex");
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionIDHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return row ?? undefined;
}
