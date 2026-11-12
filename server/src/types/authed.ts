import type { Request } from "express";
import type { Response } from "express";
import type { User } from "shared";

// A Request guaranteed to have passed auth — req.user is set.
export type AuthedRequest = Request & { user: User };

// The handler signature authed() consumers write:
// user is a plain parameter, non-optional by construction.
// Return is unconstrained — handlers typically return res.json(...) for brevity.
export type AuthedHandler = (
  req: AuthedRequest,
  res: Response,
  user: User,
) => unknown | Promise<unknown>;
