import { redis, isRedisReady } from "@/lib/redis";
import logger from "@/config/logger";

interface OTPData {
  otp: string;
  email: string;
  password: string;
  expiresAt: number;
}

const memoryStore = new Map<string, OTPData>();

/**
 * Redis-based OTP storage and verification utility.
 * Falls back to in-memory store if Redis is unavailable.
 */
export const Redis = {
  /**
   * Store an OTP for a given email.
   * 
   * @param email - User's email address
   * @param otp - One-time password to store
   * @param password - Password associated with OTP
   * @param expiresInSeconds - Optional expiration in seconds (default 600s)
   */
  async storeOTP(email: string, otp: string, password: string, expiresInSeconds = 600): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const otpData: OTPData = { otp, email, password, expiresAt };

    if (isRedisReady()) {
      try {
        await redis.setex(`otp:${email}`, expiresInSeconds, JSON.stringify(otpData));
        logger.info("OTP_STORED", { email, expiresAt: new Date(expiresAt * 1000).toISOString() });
        return;
      } catch (error) {
        logger.error("OTP_STORE_FAILED", { error, email });
      }
    }

    memoryStore.set(email, otpData);
  },

  /**
   * Verify an OTP for a given email.
   * Deletes the OTP after verification (success or expired).
   * 
   * @param email - User's email address
   * @param otp - OTP to verify
   * @returns Object with `valid` boolean, optional `password`, and optional `error` message
   */
  async verifyOTP(email: string, otp: string): Promise<{ valid: boolean; password?: string; error?: string }> {
    if (isRedisReady()) {
      try {
        const key = `otp:${email}`;
        const otpDataString = await redis.get(key);
        if (!otpDataString) return { valid: false, error: "No OTP found for this email" };

        const otpData: OTPData = JSON.parse(otpDataString);
        if (otpData.otp !== otp) return { valid: false, error: "Invalid OTP" };
        if (otpData.expiresAt < Math.floor(Date.now() / 1000)) {
          await redis.del(key);
          return { valid: false, error: "OTP has expired" };
        }

        await redis.del(key);
        return { valid: true, password: otpData.password };
      } catch (error) {
        logger.error("OTP_VERIFY_FAILED", { error, email });
      }
    }

    const otpData = memoryStore.get(email);
    if (!otpData) return { valid: false, error: "No OTP found" };
    if (otpData.otp !== otp) return { valid: false, error: "Invalid OTP" };
    if (otpData.expiresAt < Math.floor(Date.now() / 1000)) {
      memoryStore.delete(email);
      return { valid: false, error: "OTP expired" };
    }

    memoryStore.delete(email);
    return { valid: true, password: otpData.password };
  },

  /**
   * Check if an OTP exists for a given email.
   * 
   * @param email - User's email address
   * @returns Boolean indicating whether an OTP exists
   */
  async hasOTP(email: string): Promise<boolean> {
    if (isRedisReady()) {
      try {
        return (await redis.exists(`otp:${email}`)) === 1;
      } catch {}
    }
    return memoryStore.has(email);
  },

  /**
   * Remove OTP for a given email (manual cleanup).
   * 
   * @param email - User's email address
   */
  async removeOTP(email: string): Promise<void> {
    if (isRedisReady()) {
      try {
        await redis.del(`otp:${email}`);
        return;
      } catch {}
    }
    memoryStore.delete(email);
  },

  /**
   * Retrieve OTP store statistics.
   * 
   * @returns Object containing total OTPs, store size, and storage type ("redis" or "memory")
   */
  async getStats(): Promise<{ totalOTPs: number; storeSize: number; storageType: string }> {
    if (isRedisReady()) {
      try {
        const keys = await redis.keys("otp:*");
        return { totalOTPs: keys.length, storeSize: keys.length, storageType: "redis" };
      } catch {}
    }
    return { totalOTPs: memoryStore.size, storeSize: memoryStore.size, storageType: "memory" };
  },
};
