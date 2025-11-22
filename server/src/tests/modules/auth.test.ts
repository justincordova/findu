import { OTPService, AuthService } from "@/modules/auth/services";
import prisma from "@/lib/prismaClient";
import { redis } from "@/lib/redis";
import { auth } from "@/lib/auth";
import { sendOTPEmail } from "@/modules/auth/emailService";
import * as bcrypt from "bcrypt";
import logger from "@/config/logger";

jest.mock("@/lib/prismaClient", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    session: {
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock("@/lib/redis");
jest.mock("@/lib/auth", () => ({
  auth: {
    $context: Promise.resolve({
      password: {
        hash: jest.fn(),
      },
    }),
    api: {
      signInEmail: jest.fn(),
    },
  },
}));
jest.mock("@/modules/auth/emailService");
jest.mock("bcrypt");
jest.mock("@/config/logger");

describe("AuthService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe("OTPService", () => {
    describe("sendOtp", () => {
      it("should send OTP successfully if user does not exist", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (redis.set as jest.Mock).mockResolvedValue("OK");
        (sendOTPEmail as jest.Mock).mockResolvedValue({ success: true });

        const result = await OTPService.sendOtp("test@university.edu");

        expect(result.success).toBe(true);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@university.edu" },
        });
        expect(redis.set).toHaveBeenCalledWith(
          "otp:test@university.edu",
          expect.any(String),
          "EX",
          600
        );
        expect(sendOTPEmail).toHaveBeenCalledWith({
          email: "test@university.edu",
          otp: expect.any(String),
        });
        expect(logger.info).toHaveBeenCalledWith("OTP_SENT", {
          email: "test@university.edu",
        });
      });

      it("should return error if email is not a .edu address", async () => {
        const result = await OTPService.sendOtp("test@example.com");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Email must be a .edu address");
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });

      it("should return error if user already exists", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
          id: "1",
          email: "test@university.edu",
        });

        const result = await OTPService.sendOtp("test@university.edu");

        expect(result.success).toBe(false);
        expect(result.error).toBe("User already exists");
      });

      it("should return error if email sending fails", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (redis.set as jest.Mock).mockResolvedValue("OK");
        (sendOTPEmail as jest.Mock).mockResolvedValue({ success: false });

        const result = await OTPService.sendOtp("test@university.edu");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to send OTP email");
        expect(redis.del).toHaveBeenCalledWith("otp:test@university.edu");
      });

      it("should handle exceptions gracefully", async () => {
        const error = new Error("Database error");
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(error);

        const result = await OTPService.sendOtp("test@university.edu");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to send OTP");
        expect(logger.error).toHaveBeenCalledWith("SEND_OTP_ERROR", {
          error,
          email: "test@university.edu",
        });
      });
    });
  });

  describe("AuthService", () => {
    describe("signUpAndVerify", () => {
      it("should sign up and verify user successfully", async () => {
        (redis.get as jest.Mock).mockResolvedValue("123456");
        const ctx = await auth.$context;
        (ctx.password.hash as jest.Mock).mockResolvedValue("hashedPassword");
        (prisma.user.create as jest.Mock).mockResolvedValue({
          id: "1",
          email: "test@example.com",
        });
        (prisma.account.create as jest.Mock).mockResolvedValue({});
        jest.spyOn(AuthService, "signIn").mockResolvedValue({
          success: true,
          user: { id: "1", email: "test@example.com" },
          token: "token",
        });

        const result = await AuthService.signUpAndVerify(
          "test@university.edu",
          "password",
          "123456"
        );

        expect(result.success).toBe(true);
        expect(redis.get).toHaveBeenCalledWith("otp:test@university.edu");
        expect(ctx.password.hash).toHaveBeenCalledWith("password");
        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: "test@university.edu",
            name: "test",
          },
        });
        expect(prisma.account.create).toHaveBeenCalledWith({
          data: {
            userId: "1",
            providerId: "credential",
            accountId: "test@university.edu",
            password: "hashedPassword",
          },
        });
        expect(redis.del).toHaveBeenCalledWith("otp:test@university.edu");
        expect(logger.info).toHaveBeenCalledWith("USER_CREATED_SUCCESSFULLY", {
          email: "test@university.edu",
          userId: "1",
        });
        expect(AuthService.signIn).toHaveBeenCalledWith(
          "test@university.edu",
          "password"
        );
      });

      it("should return error for invalid OTP", async () => {
        (redis.get as jest.Mock).mockResolvedValue("wrong-otp");

        const result = await AuthService.signUpAndVerify(
          "test@university.edu",
          "password",
          "123456"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid or expired OTP");
      });

      it("should return error if email is not a .edu address", async () => {
        (redis.get as jest.Mock).mockReset();
        const result = await AuthService.signUpAndVerify(
          "test@example.com",
          "password",
          "123456"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Email must be a .edu address");
        expect(redis.get).not.toHaveBeenCalled();
      });

      it("should handle errors during user creation and cleanup", async () => {
        const error = new Error("Database error");
        (redis.get as jest.Mock).mockReset();
        (redis.get as jest.Mock).mockResolvedValue("123456");
        const ctx = await auth.$context;
        (ctx.password.hash as jest.Mock).mockReset();
        (ctx.password.hash as jest.Mock).mockResolvedValue("hashedPassword");
        (prisma.user.create as jest.Mock).mockReset();
        (prisma.user.create as jest.Mock).mockRejectedValue(error);
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await AuthService.signUpAndVerify(
          "test@university.edu",
          "password",
          "123456"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Database error");
        expect(logger.error).toHaveBeenCalledWith("SIGN_UP_ERROR", {
          error: "Database error",
          errorName: "Error",
          stack: expect.any(String),
          email: "test@university.edu",
        });
      });

      it("should handle errors during account creation and cleanup", async () => {
        const error = new Error("Account creation failed");
        (redis.get as jest.Mock).mockReset();
        (redis.get as jest.Mock).mockResolvedValue("123456");
        const ctx = await auth.$context;
        (ctx.password.hash as jest.Mock).mockReset();
        (ctx.password.hash as jest.Mock).mockResolvedValue("hashedPassword");
        (prisma.user.create as jest.Mock).mockReset();
        (prisma.user.create as jest.Mock).mockResolvedValue({
          id: "1",
          email: "test@university.edu",
        });
        (prisma.account.create as jest.Mock).mockReset();
        (prisma.account.create as jest.Mock).mockRejectedValue(error);
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
          id: "1",
          email: "test@university.edu",
        });
        (prisma.user.delete as jest.Mock).mockReset();
        (prisma.user.delete as jest.Mock).mockResolvedValue({});

        const result = await AuthService.signUpAndVerify(
          "test@university.edu",
          "password",
          "123456"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Account creation failed");
        expect(prisma.user.delete).toHaveBeenCalledWith({
          where: { id: "1" },
        });
      });
    });

    describe("signIn", () => {
      it("should sign in user successfully", async () => {
        const user = { id: "1", email: "test@university.edu" };
        const account = {
          userId: "1",
          providerId: "credential",
          password: "hashedPassword",
        };
        // Reset and set fresh mocks
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();
        (auth.api.signInEmail as unknown as jest.Mock).mockReset();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(account);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (auth.api.signInEmail as unknown as jest.Mock).mockResolvedValue({
          user: { id: "1", email: "test@university.edu" },
          token: "token",
        });

        const result = await AuthService.signIn(
          "test@university.edu",
          "password"
        );

        expect(result.success).toBe(true);
        expect(result.user).toEqual({ id: "1", email: "test@university.edu" });
        expect(result.token).toBe("token");
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@university.edu" },
        });
        expect(prisma.account.findFirst).toHaveBeenCalledWith({
          where: { userId: "1", providerId: "credential" },
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(
          "password",
          "hashedPassword"
        );
        expect(auth.api.signInEmail).toHaveBeenCalledWith({
          body: { email: "test@university.edu", password: "password" },
        });
        expect(logger.info).toHaveBeenCalledWith("USER_LOGIN_SUCCESSFUL", {
          email: "test@university.edu",
          userId: "1",
        });
      });

      it("should return error for invalid credentials if user not found", async () => {
        // Reset previous mock implementations and set fresh ones
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (auth.api.signInEmail as unknown as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await AuthService.signIn(
          "test@university.edu",
          "password"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid credentials");
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@university.edu" },
        });
        expect(prisma.account.findFirst).not.toHaveBeenCalled();
        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(auth.api.signInEmail).not.toHaveBeenCalled();
      });

      it("should return error for invalid credentials if account not found", async () => {
        const user = { id: "1", email: "test@university.edu" };
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (auth.api.signInEmail as unknown as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await AuthService.signIn(
          "test@university.edu",
          "password"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid credentials");
        expect(prisma.account.findFirst).toHaveBeenCalledWith({
          where: { userId: "1", providerId: "credential" },
        });
        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(auth.api.signInEmail).not.toHaveBeenCalled();
      });

      it("should return error for invalid credentials if account has no password", async () => {
        const user = { id: "1", email: "test@university.edu" };
        const account = {
          userId: "1",
          providerId: "credential",
          password: null,
        };
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (auth.api.signInEmail as unknown as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(account);

        const result = await AuthService.signIn(
          "test@university.edu",
          "password"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid credentials");
        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(auth.api.signInEmail).not.toHaveBeenCalled();
      });

      it("should return error for invalid credentials if password is incorrect", async () => {
        const user = { id: "1", email: "test@university.edu" };
        const account = {
          userId: "1",
          providerId: "credential",
          password: "hashedPassword",
        };
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (auth.api.signInEmail as unknown as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(account);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const result = await AuthService.signIn(
          "test@university.edu",
          "wrongpassword"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid credentials");
        expect(bcrypt.compare).toHaveBeenCalledWith(
          "wrongpassword",
          "hashedPassword"
        );
        expect(auth.api.signInEmail).not.toHaveBeenCalled();
      });

      it("should return error if signInEmail fails to create session", async () => {
        const user = { id: "1", email: "test@university.edu" };
        const account = {
          userId: "1",
          providerId: "credential",
          password: "hashedPassword",
        };
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (auth.api.signInEmail as unknown as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(account);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (auth.api.signInEmail as unknown as jest.Mock).mockResolvedValue(null);

        const result = await AuthService.signIn(
          "test@university.edu",
          "password"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to create session after signup");
      });

      it("should handle exceptions gracefully", async () => {
        (prisma.user.findUnique as jest.Mock).mockReset();
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(
          new Error("Database error")
        );

        const result = await AuthService.signIn(
          "test@university.edu",
          "password"
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Authentication failed");
        expect(logger.error).toHaveBeenCalledWith("SIGN_IN_ERROR", {
          error: expect.any(Error),
          email: "test@university.edu",
        });
      });
    });

    describe("signOut", () => {
      it("should sign out user successfully", async () => {
        (prisma.session.delete as jest.Mock).mockReset();
        (prisma.session.delete as jest.Mock).mockResolvedValue({});

        await AuthService.signOut("token");

        expect(prisma.session.delete).toHaveBeenCalledWith({
          where: { token: "token" },
        });
        expect(logger.info).toHaveBeenCalledWith("USER_SIGNOUT_SUCCESSFUL", {
          tokenHint: "oken",
        });
      });

      it("should handle signOut errors gracefully", async () => {
        (prisma.session.delete as jest.Mock).mockReset();
        (prisma.session.delete as jest.Mock).mockRejectedValue(
          new Error("Session not found")
        );

        await AuthService.signOut("token");

        expect(logger.warn).toHaveBeenCalledWith("SIGNOUT_ERROR", {
          errorMessage:
            "Failed to delete session, it might have already been deleted.",
          tokenHint: "oken",
          error: expect.any(Error),
        });
      });
    });

    describe("verifySession", () => {
      it("should verify session successfully", async () => {
        const session = {
          id: "session-id",
          token: "token",
          expiresAt: new Date(Date.now() + 1000000),
          user: { id: "1", email: "test@university.edu" },
        };
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

        const result = await AuthService.verifySession("token");

        expect(result).toEqual({
          id: "1",
          email: "test@university.edu",
        });
        expect(prisma.session.findUnique).toHaveBeenCalledWith({
          where: { token: "token" },
          include: { user: true },
        });
      });

      it("should return null if session not found", async () => {
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await AuthService.verifySession("token");

        expect(result).toBeNull();
      });

      it("should return null if session expired", async () => {
        const session = {
          id: "session-id",
          token: "token",
          expiresAt: new Date(Date.now() - 1000),
          user: { id: "1", email: "test@university.edu" },
        };
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

        const result = await AuthService.verifySession("token");

        expect(result).toBeNull();
      });

      it("should return null if session has no user", async () => {
        const session = {
          id: "session-id",
          token: "token",
          expiresAt: new Date(Date.now() + 1000000),
          user: null,
        };
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

        const result = await AuthService.verifySession("token");

        expect(result).toBeNull();
      });

      it("should handle exceptions gracefully", async () => {
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockRejectedValue(
          new Error("Database error")
        );

        const result = await AuthService.verifySession("token");

        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalledWith("VERIFY_SESSION_ERROR", {
          error: expect.any(Error),
        });
      });
    });

    describe("refreshSession", () => {
      it("should return session if not nearing expiration", async () => {
        const session = {
          id: "session-id",
          token: "token",
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
          user: { id: "1", email: "test@university.edu" },
        };
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

        const result = await AuthService.refreshSession("token");

        expect(result).toEqual({
          token: "token",
          user: { id: "1", email: "test@university.edu" },
        });
        expect(prisma.session.update).not.toHaveBeenCalled();
      });

      it("should refresh session if nearing expiration", async () => {
        const session = {
          id: "session-id",
          token: "token",
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          user: { id: "1", email: "test@university.edu" },
        };
        const account = {
          userId: "1",
          providerId: "credential",
        };
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (prisma.session.update as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(account);
        (prisma.session.update as jest.Mock).mockResolvedValue(session);

        const result = await AuthService.refreshSession("token");

        expect(result).toEqual({
          token: "token",
          user: { id: "1", email: "test@university.edu" },
        });
        expect(prisma.session.update).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith("SESSION_REFRESHED", {
          userId: "1",
          sessionId: "session-id",
          newExpiresAt: expect.any(String),
        });
      });

      it("should return null if session not found", async () => {
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await AuthService.refreshSession("token");

        expect(result).toBeNull();
      });

      it("should return null if session expired", async () => {
        const session = {
          id: "session-id",
          token: "token",
          expiresAt: new Date(Date.now() - 1000),
          user: { id: "1", email: "test@university.edu" },
        };
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

        const result = await AuthService.refreshSession("token");

        expect(result).toBeNull();
      });

      it("should return null if account not found", async () => {
        const session = {
          id: "session-id",
          token: "token",
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          user: { id: "1", email: "test@university.edu" },
        };
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.account.findFirst as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await AuthService.refreshSession("token");

        expect(result).toBeNull();
      });

      it("should handle exceptions gracefully", async () => {
        (prisma.session.findUnique as jest.Mock).mockReset();
        (prisma.session.findUnique as jest.Mock).mockRejectedValue(
          new Error("Database error")
        );

        const result = await AuthService.refreshSession("token");

        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalledWith("REFRESH_SESSION_ERROR", {
          error: expect.any(Error),
        });
      });
    });
  });
});
