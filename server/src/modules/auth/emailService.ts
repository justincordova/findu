import nodemailer from "nodemailer";
import logger from "@/config/logger";
import "dotenv/config";

// Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SMTP_USER,   // yourgmail@gmail.com
    pass: process.env.EMAIL_SMTP_PASS,   // app password
  },
});

export interface EmailVerificationData {
  email: string;
  verificationToken: string;
  userId: string;
}

export interface OTPEmailData {
  email: string;
  otp: string;
}

export async function sendVerificationEmail(
  data: EmailVerificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:8081"
    }/auth/account-created?token=${
      data.verificationToken
    }&email=${encodeURIComponent(data.email)}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "FindU <findu.team@gmail.com>",
      to: data.email,
      subject: "Create your FindU account",
      html: `
<div style="font-family: 'Inter', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 6px 30px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #7b5cff 0%, #5ea0ff 100%); padding: 45px 30px; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 30px; font-weight: 700;">FindU</h1>
    <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">Let's get your account set up</p>
  </div>

  <!-- Body -->
  <div style="padding: 40px 35px;">
    <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Welcome 👋</h2>
    <p style="color: #444; font-size: 15px; line-height: 1.7; margin-bottom: 28px;">
      Thanks for signing up for FindU! You're one step away from creating your account.
      Click the button below to verify your email:
    </p>

    <!-- Button -->
    <div style="text-align: center; margin: 34px 0;">
      <a href="${verificationUrl}"
        style="
          background: linear-gradient(135deg, #7b5cff 0%, #5ea0ff 100%);
          color: white;
          padding: 15px 35px;
          border-radius: 40px;
          text-decoration: none;
          font-size: 17px;
          font-weight: 600;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(125, 90, 255, 0.35);
        ">
        Verify Email
      </a>
    </div>

    <p style="color: #555; font-size: 15px; line-height: 1.6;">
      If the button doesn’t work, copy and paste this link into your browser:
    </p>

    <p style="color: #6a4fff; font-size: 14px; word-break: break-all; margin-top: 8px;">
      ${verificationUrl}
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">

    <p style="color: #888; font-size: 13px; text-align: center; line-height: 1.6;">
      This link expires in 24 hours.<br>
      If you didn’t create a FindU account, just ignore this email.
    </p>
  </div>

</div>
`,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("VERIFICATION_EMAIL_SENT", {
      email: data.email,
      messageId: info.messageId,
    });

    return { success: true };
  } catch (error) {
    logger.error("VERIFICATION_EMAIL_ERROR", {
      email: data.email,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send verification email",
    };
  }
}

export async function sendOTPEmail(
  data: OTPEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "FindU <findu.team@gmail.com>",
      to: data.email,
      subject: "Your FindU verification code",
      html: `
<div style="font-family: 'Inter', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 6px 30px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #7b5cff 0%, #5ea0ff 100%); padding: 45px 30px; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 30px; font-weight: 700;">FindU</h1>
    <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">Verify your account</p>
  </div>

  <!-- Body -->
  <div style="padding: 40px 35px;">
    <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Your verification code</h2>
    <p style="color: #444; font-size: 15px; line-height: 1.7; margin-bottom: 28px;">
      Enter the 6-digit code below to continue setting up your FindU account:
    </p>

    <div style="text-align: center; margin: 34px 0;">
      <div style="
        background: #f4f7ff;
        border: 2px solid #7b5cff;
        padding: 22px 35px;
        border-radius: 14px;
        display: inline-block;
        box-shadow: 0 4px 15px rgba(125, 90, 255, 0.15);
      ">
        <span style="font-size: 34px; font-weight: 700; letter-spacing: 6px; color: #6a4fff; font-family: monospace;">
          ${data.otp}
        </span>
      </div>
    </div>

    <p style="color: #555; font-size: 15px; line-height: 1.6;">
      This code expires in 10 minutes. If you didn’t request it, you can ignore this email.
    </p>

  </div>

</div>
`,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("OTP_EMAIL_SENT", {
      email: data.email,
      messageId: info.messageId,
    });

    return { success: true };
  } catch (error) {
    logger.error("OTP_EMAIL_ERROR", {
      email: data.email,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send OTP email",
    };
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info("EMAIL_CONNECTION_SUCCESS");
    return true;
  } catch (error) {
    logger.error("EMAIL_CONNECTION_ERROR", { error });
    return false;
  }
}
