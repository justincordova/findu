import nodemailer from "nodemailer";
import logger from "@/config/logger";
import "dotenv/config";

// Create transporter for SendGrid SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || "smtp.sendgrid.net",
  port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SMTP_USER || "apikey",
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

export interface EmailVerificationData {
  email: string;
  verificationToken: string;
  userId: string;
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">FindU</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Create your account</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to FindU!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Thanks for signing up! To create your account and start using FindU, 
              please click the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Create Account
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; word-break: break-all; font-size: 14px;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              This link will expire in 24 hours. If you didn't sign up for FindU, 
              you can safely ignore this email.
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
