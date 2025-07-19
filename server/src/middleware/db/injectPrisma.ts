import { Request, Response, NextFunction } from "express";
import prisma from "@/lib/prisma";

export function injectPrisma(req: Request, res: Response, next: NextFunction) {
  res.locals.prisma = prisma;
  next();
}
