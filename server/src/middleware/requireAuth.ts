import type { RequestHandler } from "express";
import { getUserFromRequest } from "./getUserFromRequest.js";

// Raw middleware version: authenticates or rejects.
// The lookup itself lives in getUserFromRequest so the WS handshake
// and the authed() wrapper can share it.
export const requireAuth: RequestHandler = async (req, res, next) => {
  const user = await getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ error: "Not Authorized" });
  }

  req.user = user;
  next();
};
