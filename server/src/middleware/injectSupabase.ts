// src/middleware/injectSupabase.ts
import { Request, Response, NextFunction } from 'express';
import supabase from '../lib/supabase';

export function injectSupabase(req: Request, res: Response, next: NextFunction) {
  res.locals.supabase = supabase;
  next();
}
