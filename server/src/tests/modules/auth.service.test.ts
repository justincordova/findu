import app from "@/app";
import request from "supertest";

// Mock the auth services
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

// Mock the email service so no real emails are sent
jest.mock("@/modules/auth/emailService", () => ({
  sendOTPEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock logger so it doesn’t write to console during tests
jest.mock("@/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock Supabase Admin client to avoid needing real env variables
jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-id", email: "student@school.edu" } },
          error: null,
        }),
        listUsers: jest.fn().mockResolvedValue({
          data: { users: [{ id: "user-id", email: "student@school.edu" }] },
          error: null,
        }),
        deleteUser: jest.fn().mockResolvedValue({ error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          user: { id: "user-id", email: "student@school.edu" },
          session: { access_token: "fake-token" },
        },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-id", email: "student@school.edu" } },
        error: null,
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: {
          user: { id: "user-id", email: "student@school.edu" },
          session: { access_token: "fake-token" },
        },
        error: null,
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-id", email: "student@school.edu" } },
        error: null,
      }),
    },
  },
}));

describe("Auth API happy path cases", () => {
  const eduEmail = "student@school.edu";
  const password = "Password123!";

  it("POST /api/auth/signup", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: eduEmail, password });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
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
    expect(res.body.success).toBe(true);
  });

  it("POST /api/auth/reset-password", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "fake-token", password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/auth/logout", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer fake-token");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/auth/me", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer fake-token");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });
});

describe("Auth API edge & failure cases", () => {
  const eduEmail = "student@school.edu";
  const nonEduEmail = "user@gmail.com";
  const password = "Password123!";

  it("should reject signup with non-.edu email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: nonEduEmail, password });
    expect(res.status).toBe(400); // or whatever you use for invalid email
    expect(res.body.success).toBe(false);
  });

  it("should reject signup if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ password });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject signup with weak password", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: eduEmail, password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject login with wrong password", async () => {
    const { AuthService } = require("@/modules/auth/services");
    AuthService.authenticate.mockResolvedValueOnce({
      success: false,
      error: "Invalid credentials",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: eduEmail, password: "WrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject OTP verification with invalid OTP", async () => {
    const { OTPService } = require("@/modules/auth/services");
    OTPService.verifyOTP.mockResolvedValueOnce({
      success: false,
      error: "Invalid or expired OTP",
    });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: eduEmail, otp: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject reset-password with invalid token", async () => {
    const { AuthService } = require("@/modules/auth/services");
    AuthService.resetPassword.mockResolvedValueOnce({
      success: false,
      error: "Invalid or expired token",
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "bad-token", password });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject forgot-password if user not found", async () => {
    const { AuthService } = require("@/modules/auth/services");
    AuthService.requestPasswordReset.mockResolvedValueOnce({
      success: false,
      error: "User not found",
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nouser@school.edu" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should block /me without Authorization header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should block /me with invalid token", async () => {
    const { AuthService } = require("@/modules/auth/services");
    AuthService.getCurrentUser.mockResolvedValueOnce({
      success: false,
      error: "Invalid token",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer bad-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject /me if session expired", async () => {
    const { AuthService } = require("@/modules/auth/services");
    AuthService.getCurrentUser.mockResolvedValueOnce({
      success: false,
      error: "Session expired",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer expired-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should fail logout if no Authorization header provided", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should handle unexpected server error from AuthService", async () => {
    const { AuthService } = require("@/modules/auth/services");
    AuthService.authenticate.mockRejectedValueOnce(new Error("Supabase down"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: eduEmail, password });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
