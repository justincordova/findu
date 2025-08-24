import app from "@/app";
import request from "supertest";

jest.mock("@/modules/auth/services", () => ({
  OTPService: {
    createPendingSignup: jest.fn().mockResolvedValue({ success: true }),
    verifyOTP: jest.fn().mockResolvedValue({
      success: true,
      user: { id: "user-id", email: "student@school.edu" },
    }),
  },
  AuthService: {
    authenticate: jest.fn().mockResolvedValue({
      success: true,
      user: { id: "user-id", email: "student@school.edu" },
      session: { access_token: "fake-token" },
    }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    getCurrentUser: jest.fn().mockResolvedValue({
      success: true,
      user: { id: "user-id", email: "student@school.edu" },
    }),
    requestPasswordReset: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock("@/modules/auth/emailService", () => ({
  sendOTPEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));


describe("Minimal Auth API tests (.edu emails)", () => {
  const eduEmail = "student@school.edu";
  const password = "Password123!";

  it("POST /api/auth/signup", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: eduEmail, password });
    expect([200, 201]).toContain(res.status);
  });

  it("POST /api/auth/login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: eduEmail, password });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it("POST /api/auth/verify-otp", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: eduEmail, otp: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it("POST /api/auth/forgot-password", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: eduEmail });
    expect(res.status).toBe(200);
  });

  it("POST /api/auth/reset-password", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "fake-token", password });
    expect(res.status).toBe(200);
  });

  it("POST /api/auth/logout", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer fake-token");
    expect(res.status).toBe(200);
  });

  it("GET /api/auth/me", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer fake-token");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });
});
