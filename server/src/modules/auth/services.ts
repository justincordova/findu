import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { sendOTPEmail } from "@/modules/auth/emailService";
import logger from "@/config/logger";
import { generateOTP } from "@/utils/auth";
import prisma from "@/lib/prismaClient";
import * as bcrypt from "bcrypt";
import { AuthResult, PendingSignupResult } from "@/types/auth";

const OTP_EXPIRATION = Number(process.env.OTP_EXPIRATION_SECONDS) || 600;
const OTP_RATE_LIMIT_KEY = (email: string) => `otp_rate_limit:${email}`;
const OTP_RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

/**
 * Service for handling OTP-related functionality, including sending OTPs
 * and managing temporary storage in Redis.
 */
export const OTPService = {
  /**
   * Sends an OTP to a given email address for signup verification.
   * Validates if the user already exists, stores OTP in Redis, and sends an email.
   * Implements retry logic with exponential backoff for email failures.
   *
   * @param email - Email address to send the OTP to (must be a .edu address)
   * @returns Promise resolving to a PendingSignupResult indicating success or error
   */
  sendOtp: async (email: string): Promise<PendingSignupResult> => {
    try {
      // Validate email is a .edu address
      if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
        return { success: false, error: "Email must be a .edu address" };
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      // Check rate limiting
      const rateLimitKey = OTP_RATE_LIMIT_KEY(email);
      const attemptCount = await redis.get(rateLimitKey);
      if (attemptCount && parseInt(attemptCount) >= MAX_RETRIES) {
        return {
          success: false,
          error: "Too many OTP requests. Please try again later."
        };
      }

      const otp = generateOTP();
      await redis.set(`otp:${email}`, otp, "EX", OTP_EXPIRATION);

      // Send OTP email with retry logic
      let emailSuccess = false;
      let emailError = "";
      let delayMs = OTP_RETRY_DELAY_MS;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const { success, error } = await sendOTPEmail({ email, otp });
        if (success) {
          emailSuccess = true;
          break;
        }
        emailError = error || "Failed to send OTP email";

        if (attempt < MAX_RETRIES) {
          logger.debug("OTP_SEND_RETRY", { email, attempt, nextDelayMs: delayMs });
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
        }
      }

      if (!emailSuccess) {
        await redis.del(`otp:${email}`);
        // Increment rate limit counter
        await redis.incr(rateLimitKey);
        await redis.expire(rateLimitKey, 3600); // 1 hour cooldown
        return { success: false, error: emailError };
      }

      logger.info("OTP_SENT", { email });
      return { success: true };
    } catch (error) {
      logger.error("SEND_OTP_ERROR", { error, email });
      return { success: false, error: "Failed to send OTP" };
    }
  },
};

/**
 * Service for handling authentication, including signup, login,
 * session verification, and session refresh.
 */
export const AuthService = {
  /**
   * Signs up a user with email, password, and OTP verification.
   * Creates user and account records in the database and signs in the user.
   *
   * @param email - User's email address (must be a .edu address)
   * @param password - User's password
   * @param otp - OTP provided by the user for verification
   * @returns Promise resolving to AuthResult indicating success or failure
   */
  signUpAndVerify: async (
    email: string,
    password: string,
    otp: string
  ): Promise<AuthResult> => {
    try {
      // Validate email is a .edu address
      if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
        return { success: false, error: "Email must be a .edu address" };
      }

      const storedOtp = await redis.get(`otp:${email}`);
      if (storedOtp !== otp) {
        return { success: false, error: "Invalid or expired OTP" };
      }

      const ctx = await auth.$context;
      const hashedPassword = await ctx.password.hash(password);

      // Wrap user and account creation in transaction for atomicity
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            name: email.split("@")[0],
          },
        });

        await tx.account.create({
          data: {
            userId: user.id,
            providerId: "credential",
            accountId: email,
            password: hashedPassword,
          },
        });
      });

      await redis.del(`otp:${email}`);
      logger.info("USER_CREATED_SUCCESSFULLY", { email });

      return await AuthService.signIn(email, password);
    } catch (error: any) {
      const { message: errorMessage, name: errorName, stack: errorStack } = error || {};
      logger.error("SIGN_UP_ERROR", {
        error: errorMessage || error,
        errorName,
        stack: errorStack,
        email,
      });
      // Transaction will automatically rollback on error, so no manual cleanup needed
      return {
        success: false,
        error: errorMessage || "Failed to create user account",
      };
    }
  },

  /**
   * Signs in a user using email and password.
   * Validates credentials against the database and returns a session token.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to AuthResult indicating success or failure
   */
  signIn: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return { success: false, error: "Invalid credentials" };

      const account = await prisma.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });

      if (!account || !account.password) {
        return { success: false, error: "Invalid credentials" };
      }

      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid)
        return { success: false, error: "Invalid credentials" };

      const signInResult = await auth.api.signInEmail({
        body: { email, password },
      });

      if (!signInResult || !signInResult.user || !signInResult.token) {
        return {
          success: false,
          error: "Failed to create session after signup",
        };
      }

      const { user: signedInUser, token } = signInResult;
      logger.info("USER_LOGIN_SUCCESSFUL", {
        email,
        userId: signedInUser.id,
      });

      return {
        success: true,
        user: {
          id: signedInUser.id,
          email: signedInUser.email
        },
        token,
      };
    } catch (error) {
      logger.error("SIGN_IN_ERROR", { error, email });
      return { success: false, error: "Authentication failed" };
    }
  },

  /**
   * Verifies a session token and returns the corresponding user ID and email.
   *
   * @param token - Session token to verify
   * @returns Promise resolving to user info or null if invalid/expired
   */
  verifySession: async (
    token: string
  ): Promise<{ id: string; email: string | null } | null> => {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || !session.user || session.expiresAt < new Date())
        return null;

      return { id: session.user.id, email: session.user.email || null };
    } catch (error) {
      logger.error("VERIFY_SESSION_ERROR", { error });
      return null;
    }
  },

  /**
   * Signs out a user by deleting their session from the database.
   *
   * @param token - The session token to invalidate
   * @returns Promise resolving when the session is deleted
   */
  signOut: async (token: string): Promise<void> => {
    try {
      // This will gracefully fail if the session doesn't exist.
      await prisma.session.delete({ where: { token } });
      logger.info("USER_SIGNOUT_SUCCESSFUL", { tokenHint: token.slice(-4) });
    } catch (error) {
      // Log error but don't throw, as the session may already be invalid.
      logger.warn("SIGNOUT_ERROR", {
        errorMessage:
          "Failed to delete session, it might have already been deleted.",
        tokenHint: token.slice(-4),
        error,
      });
    }
  },

  /**
   * Refreshes a session token if it's nearing expiration.
   *
   * @param token - Current session token
   * @returns Promise resolving to refreshed session info or null if invalid
   */
  refreshSession: async (
    token: string
  ): Promise<{
    token: string;
    user: { id: string; email: string | null };
  } | null> => {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || !session.user || session.expiresAt < new Date())
        return null;

      const daysUntilExpiry =
        (session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry > 7) {
        return {
          token,
          user: { id: session.user.id, email: session.user.email || null },
        };
      }

      const account = await prisma.account.findFirst({
        where: { userId: session.user.id, providerId: "credential" },
      });

      if (!account) return null;

      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiresAt },
      });

      logger.info("SESSION_REFRESHED", {
        userId: session.user.id,
        sessionId: session.id,
        newExpiresAt: newExpiresAt.toISOString(),
      });

      return {
        token,
        user: { id: session.user.id, email: session.user.email || null },
      };
    } catch (error) {
      logger.error("REFRESH_SESSION_ERROR", { error });
      return null;
    }
  },

  /**
   * Verifies an OTP for a given email address.
   * Does not create an account - just validates the OTP.
   *
   * @param email - User's email address (must be a .edu address)
   * @param otp - OTP provided by the user
   * @returns Promise resolving to PendingSignupResult indicating success or error
   */
  verifyOtp: async (
    email: string,
    otp: string
  ): Promise<PendingSignupResult> => {
    try {
      // Validate email is a .edu address
      if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
        return { success: false, error: "Email must be a .edu address" };
      }

      const storedOtp = await redis.get(`otp:${email}`);
      if (storedOtp !== otp) {
        return { success: false, error: "Invalid or expired OTP" };
      }

      logger.info("OTP_VERIFIED", { email });
      return { success: true };
    } catch (error) {
      logger.error("VERIFY_OTP_ERROR", { error, email });
      return { success: false, error: "Failed to verify OTP" };
    }
  },

  /**
   * Creates an account with email and password after OTP verification.
   * Should only be called after OTP has been verified.
   *
   * @param email - User's email address (must be a .edu address)
   * @param password - User's password
   * @returns Promise resolving to AuthResult indicating success or failure
   */
  createAccountWithPassword: async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      // Validate email is a .edu address
      if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
        return { success: false, error: "Email must be a .edu address" };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      // Hash password and create user account
      const ctx = await auth.$context;
      const hashedPassword = await ctx.password.hash(password);

      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: email,
          password: hashedPassword,
        },
      });

      // Clean up OTP from Redis
      await redis.del(`otp:${email}`);
      logger.info("ACCOUNT_CREATED_SUCCESSFULLY", { email, userId: user.id });

      // Sign in the user and return token
      return await AuthService.signIn(email, password);
    } catch (error: any) {
      const { message: errorMessage, name: errorName, stack: errorStack } = error || {};
      logger.error("CREATE_ACCOUNT_ERROR", {
        error: errorMessage || error,
        errorName,
        stack: errorStack,
        email,
      });
      // Clean up partially created user if something went wrong
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.user.delete({ where: { id: user.id } });
      }
      return {
        success: false,
        error: errorMessage || "Failed to create account",
      };
    }
  },
};
