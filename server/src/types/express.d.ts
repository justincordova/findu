// Express Request augmentation.
//
// `requireAuth` middleware attaches an authenticated user object to the
// request. Declaring it once here lets controllers read `req.user?.id`
// directly instead of casting `(req as any).user`.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        role?: string;
      };
    }
  }
}

export {};
