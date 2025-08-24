import Redis from "ioredis";
import logger from "@/config/logger";

interface OTPData {
  otp: string;
  email: string;
  password: string;
  expiresAt: number;
}

type Stats = { totalOTPs: number; storeSize: number; storageType: "redis" | "memory" };

export class OTPStore {
  private redis: Redis;
  private isConnected: boolean = false;
  private store: Map<string, OTPData> = new Map(); // in-memory fallback
  private useRedis: boolean = false;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
    });

    this.redis.on("connect", () => {
      this.isConnected = true;
      this.useRedis = true;
      logger.info("REDIS_OTP_STORE_CONNECTED");
    });

    this.redis.on("error", (error) => {
      this.isConnected = false;
      this.useRedis = false;
      logger.error("REDIS_OTP_STORE_ERROR", { error: error.message });
    });

    this.redis.on("close", () => {
      this.isConnected = false;
      this.useRedis = false;
      logger.warn("REDIS_OTP_STORE_DISCONNECTED");
    });
  }

  async storeOTP(email: string, otp: string, password: string, expiresInSeconds: number = 600): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const otpData: OTPData = { otp, email, password, expiresAt };

    if (this.useRedis && this.isConnected) {
      try {
        await this.redis.setex(`otp:${email}`, expiresInSeconds, JSON.stringify(otpData));
        logger.info("REDIS_OTP_STORED", { email, expiresAt: new Date(expiresAt * 1000).toISOString() });
        return;
      } catch (error) {
        logger.error("REDIS_OTP_STORE_FAILED", { error, email });
        this.useRedis = false; // fallback to memory
      }
    }

    // fallback to in-memory store
    this.store.set(email, otpData);
  }

  async verifyOTP(email: string, otp: string): Promise<{ valid: boolean; password?: string; error?: string }> {
    if (this.useRedis && this.isConnected) {
      try {
        const key = `otp:${email}`;
        const otpDataString = await this.redis.get(key);
        if (!otpDataString) return { valid: false, error: "No OTP found for this email" };
        const otpData: OTPData = JSON.parse(otpDataString);

        if (otpData.otp !== otp) return { valid: false, error: "Invalid OTP" };
        if (otpData.expiresAt < Math.floor(Date.now() / 1000)) {
          await this.redis.del(key);
          return { valid: false, error: "OTP has expired" };
        }

        await this.redis.del(key);
        return { valid: true, password: otpData.password };
      } catch {
        this.useRedis = false; // fallback to memory
      }
    }

    // fallback to memory
    const otpData = this.store.get(email);
    if (!otpData) return { valid: false, error: "No OTP found for this email" };
    if (otpData.otp !== otp) return { valid: false, error: "Invalid OTP" };
    if (otpData.expiresAt < Math.floor(Date.now() / 1000)) {
      this.store.delete(email);
      return { valid: false, error: "OTP has expired" };
    }
    this.store.delete(email);
    return { valid: true, password: otpData.password };
  }

  async hasOTP(email: string): Promise<boolean> {
    if (this.useRedis && this.isConnected) {
      try {
        const exists = await this.redis.exists(`otp:${email}`);
        return exists === 1;
      } catch {
        this.useRedis = false;
      }
    }
    return this.store.has(email);
  }

  async removeOTP(email: string): Promise<void> {
    if (this.useRedis && this.isConnected) {
      try {
        await this.redis.del(`otp:${email}`);
        return;
      } catch {
        this.useRedis = false;
      }
    }
    this.store.delete(email);
  }

  async getStats(): Promise<Stats> {
    if (this.useRedis && this.isConnected) {
      try {
        const keys = await this.redis.keys("otp:*");
        return { totalOTPs: keys.length, storeSize: keys.length, storageType: "redis" };
      } catch {
        this.useRedis = false;
      }
    }
    return { totalOTPs: this.store.size, storeSize: this.store.size, storageType: "memory" };
  }

  async destroy(): Promise<void> {
    if (this.redis) await this.redis.quit();
  }

  isReady(): boolean {
    return this.useRedis && this.isConnected;
  }
}

export const otpStore = new OTPStore();
