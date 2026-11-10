import { Router } from "express";
import { signupSchema, loginSchema } from "shared";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { requireAuth } from "../middleware/requireAuth.js";

const DUMMY_HASH = await argon2.hash(randomBytes(32).toString("base64url"));

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const sessionCookieOptions = {
  httpOnly: true, // not readable by client JavaScript
  sameSite: "lax" as const, // blocks most cross-site request forgery
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  maxAge: SESSION_TTL_MS, // browser drops the cookie when the session expires
  path: "/",
};

export const authRouter = Router();

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.post("/logout", async (req, res) => {
  const sessionToken = req.cookies?.session;
  if (sessionToken) {
    const sessionIDHash = createHash("sha256").update(sessionToken).digest("hex");
    await db.delete(sessions).where(eq(sessions.id, sessionIDHash));
  }

  res.clearCookie("session", { path: "/" });
  res.status(200).json({ message: "Successfully logged out" });
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: z.prettifyError(parsed.error) });
  }

  const { name, email, password } = parsed.data;
  const hashedPassword = await argon2.hash(password);

  try {
    const [newUser] = await db
      .insert(users)
      .values({ name, email, hashedPassword })
      .returning({ id: users.id, name: users.name, email: users.email });

    res.status(201).json({ user: newUser });
  } catch (err) {
    // Postgres unique_violation: email already registered
    const code =
      (err as { code?: string; cause?: { code?: string } }).cause?.code ??
      (err as { code?: string }).code;
    if (code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    throw err;
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: z.prettifyError(parsed.error) });
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const ok = await argon2.verify(user?.hashedPassword ?? DUMMY_HASH, password);

  if (!user || !ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const sessionID = randomBytes(32).toString("base64url");
  const sessionIDHash = createHash("sha256").update(sessionID).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({ id: sessionIDHash, userId: user.id, expiresAt });

  res.cookie("session", sessionID, sessionCookieOptions);
  res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } });
});
