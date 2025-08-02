// Currently we have all the middleware config in app.ts
// Later when we add more config we split them into individual middleware files
// Then combine them in middleware/index.ts

export * from "./auth/requireSupabaseAuth";
export * from "./auth/requireAdmin";
export * from "./auth/jwtAuth";
export * from "./error/errorHandler";
export * from "./error/notFoundHandler";
export * from "./error/handleValidationErrors";
