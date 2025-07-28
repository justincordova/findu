import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/modules/auth/service";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export async function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authorization token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = await verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
}
