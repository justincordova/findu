import { EmailVerificationData, OTPEmailData } from "@/modules/auth/emailService";

describe("EmailService", () => {
  let sendMailMock: jest.Mock;
  let verifyMock: jest.Mock;
  let emailService: typeof import("@/modules/auth/emailService");
  let loggerMock: any;

  beforeEach(() => {
    jest.resetModules();
    
    sendMailMock = jest.fn().mockResolvedValue({ messageId: "test-id" });
    verifyMock = jest.fn().mockResolvedValue(true);

    jest.doMock("nodemailer", () => ({
      createTransport: jest.fn().mockReturnValue({
        sendMail: sendMailMock,
        verify: verifyMock,
      }),
    }));

    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
    };
    jest.doMock("@/config/logger", () => ({
      __esModule: true,
      default: loggerMock,
    }));

    emailService = require("@/modules/auth/emailService");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("sendVerificationEmail", () => {
    it("should send verification email successfully", async () => {
      const data: EmailVerificationData = {
        email: "test@example.com",
        verificationToken: "token123",
        userId: "user123",
      };

      const result = await emailService.sendVerificationEmail(data);

      expect(result.success).toBe(true);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Create your FindU account",
        })
      );
      expect(loggerMock.info).toHaveBeenCalledWith("VERIFICATION_EMAIL_SENT", {
        email: "test@example.com",
        messageId: "test-id",
      });
    });

    it("should handle errors when sending verification email", async () => {
      sendMailMock.mockRejectedValue(new Error("SMTP Error"));

      const data: EmailVerificationData = {
        email: "test@example.com",
        verificationToken: "token123",
        userId: "user123",
      };

      const result = await emailService.sendVerificationEmail(data);

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP Error");
      expect(loggerMock.error).toHaveBeenCalledWith("VERIFICATION_EMAIL_ERROR", {
        email: "test@example.com",
        error: "SMTP Error",
      });
    });
  });

  describe("sendOTPEmail", () => {
    it("should send OTP email successfully", async () => {
      const data: OTPEmailData = {
        email: "test@example.com",
        otp: "123456",
      };

      const result = await emailService.sendOTPEmail(data);

      expect(result.success).toBe(true);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Your FindU verification code",
          html: expect.stringContaining("123456"),
        })
      );
      expect(loggerMock.info).toHaveBeenCalledWith("OTP_EMAIL_SENT", {
        email: "test@example.com",
        messageId: "test-id",
      });
    });

    it("should handle errors when sending OTP email", async () => {
      sendMailMock.mockRejectedValue(new Error("SMTP Error"));

      const data: OTPEmailData = {
        email: "test@example.com",
        otp: "123456",
      };

      const result = await emailService.sendOTPEmail(data);

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP Error");
      expect(loggerMock.error).toHaveBeenCalledWith("OTP_EMAIL_ERROR", {
        email: "test@example.com",
        error: "SMTP Error",
      });
    });
  });

  describe("testEmailConnection", () => {
    it("should return true if connection is successful", async () => {
      const result = await emailService.testEmailConnection();

      expect(result).toBe(true);
      expect(verifyMock).toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith("EMAIL_CONNECTION_SUCCESS");
    });

    it("should return false if connection fails", async () => {
      verifyMock.mockRejectedValue(new Error("Connection Error"));

      const result = await emailService.testEmailConnection();

      expect(result).toBe(false);
      expect(loggerMock.error).toHaveBeenCalledWith("EMAIL_CONNECTION_ERROR", {
        error: expect.any(Error),
      });
    });
  });
});
