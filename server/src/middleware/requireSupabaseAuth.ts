import { Request, Response, NextFunction } from "express";
import { verifySession } from "../services/auth";

export async function requireSupabaseAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header." });
  }
  const token = authHeader.replace("Bearer ", "");
  const user = await verifySession(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
  (req as any).user = user;
  next();
}
