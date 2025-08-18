import Redis from "ioredis";
import logger from "@/config/logger";

interface OTPData {
  otp: string;
  email: string;
  password: string;
  expiresAt: number; // Unix timestamp
}

class RedisOTPStore {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
    });

    this.redis.on("connect", () => {
      this.isConnected = true;
      logger.info("REDIS_OTP_STORE_CONNECTED");
    });

    this.redis.on("error", (error) => {
      this.isConnected = false;
      logger.error("REDIS_OTP_STORE_ERROR", { error: error.message });
    });

    this.redis.on("close", () => {
      this.isConnected = false;
      logger.warn("REDIS_OTP_STORE_DISCONNECTED");
    });
  }

  /**
   * Store OTP with expiration
   */
  async storeOTP(
    email: string,
    otp: string,
    password: string,
    expiresInSeconds: number = 600
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Redis not connected");
    }

    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const otpData: OTPData = {
      otp,
      email,
      password,
      expiresAt,
    };

    const key = `otp:${email}`;
    await this.redis.setex(key, expiresInSeconds, JSON.stringify(otpData));

    logger.info("REDIS_OTP_STORED", {
      email,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      key,
    });
  }

  /**
   * Verify OTP and return data if valid
   */
  async verifyOTP(
    email: string,
    otp: string
  ): Promise<{ valid: boolean; password?: string; error?: string }> {
    if (!this.isConnected) {
      throw new Error("Redis not connected");
    }

    const key = `otp:${email}`;
    const otpDataString = await this.redis.get(key);

    if (!otpDataString) {
      return { valid: false, error: "No OTP found for this email" };
    }

    try {
      const otpData: OTPData = JSON.parse(otpDataString);

      if (otpData.otp !== otp) {
        return { valid: false, error: "Invalid OTP" };
      }

      if (otpData.expiresAt < Math.floor(Date.now() / 1000)) {
        // Remove expired OTP
        await this.redis.del(key);
        return { valid: false, error: "OTP has expired" };
      }

      // OTP is valid, remove it from store and return password
      const password = otpData.password;
      await this.redis.del(key);

      logger.info("REDIS_OTP_VERIFIED_SUCCESSFULLY", { email });

      return { valid: true, password };
    } catch (error) {
      logger.error("REDIS_OTP_PARSE_ERROR", { error, email });
      return { valid: false, error: "Invalid OTP data" };
    }
  }

  /**
   * Check if OTP exists for email
   */
  async hasOTP(email: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const key = `otp:${email}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Remove OTP for email
   */
  async removeOTP(email: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    const key = `otp:${email}`;
    await this.redis.del(key);
    logger.info("REDIS_OTP_REMOVED", { email });
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<{ totalOTPs: number; storeSize: number }> {
    if (!this.isConnected) {
      return { totalOTPs: 0, storeSize: 0 };
    }

    const keys = await this.redis.keys("otp:*");
    return {
      totalOTPs: keys.length,
      storeSize: keys.length,
    };
  }

  /**
   * Cleanup on shutdown
   */
  async destroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Check connection status
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

export const redisOTPStore = new RedisOTPStore();
