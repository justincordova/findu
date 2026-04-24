const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock("nodemailer", () => ({
  createTransport: () => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  }),
}));

import logger from "@/config/logger";
import {
  sendOTPEmail,
  sendVerificationEmail,
  testEmailConnection,
} from "@/modules/auth/emailService";

jest.mock("@/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Email Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendVerificationEmail", () => {
    const verificationData = {
      email: "test@example.com",
      verificationToken: "token123",
      userId: "user123",
    };

    it("should send a verification email successfully", async () => {
      mockSendMail.mockResolvedValue({ messageId: "message-id" });

      const result = await sendVerificationEmail(verificationData);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith("VERIFICATION_EMAIL_SENT", {
        email: verificationData.email,
        messageId: "message-id",
      });
    });

    it("should use FRONTEND_URL environment variable if set", async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, FRONTEND_URL: "https://findu.app" };

      await sendVerificationEmail(verificationData);

      const emailHtml = mockSendMail.mock.calls[0][0].html;
      expect(emailHtml).toContain(
        "https://findu.app/auth/account-created?token=token123",
      );

      process.env = originalEnv; // Restore original environment
    });

    it("should return an error if sending fails", async () => {
      const error = new Error("SMTP Error");
      mockSendMail.mockRejectedValue(error);

      const result = await sendVerificationEmail(verificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP Error");
      expect(logger.error).toHaveBeenCalledWith("VERIFICATION_EMAIL_ERROR", {
        email: verificationData.email,
        error: "SMTP Error",
      });
    });
  });

  describe("sendOTPEmail", () => {
    const otpData = {
      email: "test@example.com",
      otp: "123456",
    };

    it("should send an OTP email successfully", async () => {
      mockSendMail.mockResolvedValue({ messageId: "message-id" });

      const result = await sendOTPEmail(otpData);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith("OTP_EMAIL_SENT", {
        email: otpData.email,
        messageId: "message-id",
      });
    });

    it("should return an error if sending fails", async () => {
      const error = new Error("SMTP Error");
      mockSendMail.mockRejectedValue(error);

      const result = await sendOTPEmail(otpData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP Error");
      expect(logger.error).toHaveBeenCalledWith("OTP_EMAIL_ERROR", {
        email: otpData.email,
        error: "SMTP Error",
      });
    });
  });

  describe("testEmailConnection", () => {
    it("should return true if connection is successful", async () => {
      mockVerify.mockResolvedValue(true);

      const result = await testEmailConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith("EMAIL_CONNECTION_SUCCESS");
    });

    it("should return false if connection fails", async () => {
      const error = new Error("Connection failed");
      mockVerify.mockRejectedValue(error);

      const result = await testEmailConnection();

      expect(result).toBe(false);
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith("EMAIL_CONNECTION_ERROR", {
        error,
      });
    });
  });
});
