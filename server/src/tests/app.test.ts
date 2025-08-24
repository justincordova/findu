import request from "supertest";
import app from "@/app";

// Mock all security middleware so they don’t run during tests
jest.mock("@/middleware/security/corsConfig", () => jest.fn((req, res, next) => next()));
jest.mock("@/middleware/security/helmetConfig", () => jest.fn((req, res, next) => next()));
jest.mock("@/middleware/security/compressionConfig", () => jest.fn((req, res, next) => next()));
jest.mock("@/middleware/security/morganConfig", () => jest.fn((req, res, next) => next()));
jest.mock("@/middleware/security/rateLimiterConfig", () => jest.fn((req, res, next) => next()));

// Mock logger to prevent async file writes
jest.mock("@/config/logger", () => ({
  http: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("App Integration Tests", () => {
  it("should return 200 and OK for /health route", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "OK",
      environment: process.env.NODE_ENV || "development",
    });
    expect(res.body.timestamp).toBeDefined();
  });

  it("should return 404 for unknown route", async () => {
    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should trigger global error handler on thrown error", async () => {
    // Only run this test in non-production
    if (process.env.NODE_ENV === "production") return;

    const res = await request(app).get("/error-test");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal Server Error");
  });
});
