import type { RequestHandler } from "express";
import type { AuthedRequest, AuthedHandler } from "../types/authed.js";
import { getUserFromRequest } from "./getUserFromRequest.js";

export function authed(handler: AuthedHandler): RequestHandler {
  return async (req, res, next) => {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Not Authorized" });
    }

    return handler(req as AuthedRequest, res, user);
  };
}
