import logger from "@/config/logger";

interface OTPData {
  otp: string;
  email: string;
  password: string;
  expiresAt: Date;
}

class OTPStore {
  private store: Map<string, OTPData> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private useRedis: boolean = false;
  private redisStore: any = null;

  constructor() {
    // Try to use Redis if available
    this.initializeRedis();

    // Clean up expired OTPs every 5 minutes (only for in-memory store)
    this.cleanupInterval = setInterval(() => {
      if (!this.useRedis) {
        this.cleanupExpiredOTPs();
      }
    }, 5 * 60 * 1000);
  }

  private async initializeRedis() {
    try {
      const { redisOTPStore } = await import("./redisOTPStore");
      if (redisOTPStore.isReady()) {
        this.redisStore = redisOTPStore;
        this.useRedis = true;
        logger.info("OTP_STORE_USING_REDIS");
      } else {
        logger.info("OTP_STORE_FALLBACK_TO_MEMORY");
      }
    } catch (error) {
      logger.info("OTP_STORE_FALLBACK_TO_MEMORY", {
        error: "Redis not available",
      });
    }
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
    if (this.useRedis && this.redisStore) {
      try {
        await this.redisStore.storeOTP(email, otp, password, expiresInSeconds);
        return;
      } catch (error) {
        logger.warn("REDIS_OTP_STORE_FAILED_FALLBACK_TO_MEMORY", {
          error,
          email,
        });
        this.useRedis = false;
      }
    }

    // Fallback to in-memory store
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    const otpData: OTPData = {
      otp,
      email,
      password,
      expiresAt,
    };

    this.store.set(email, otpData);

    logger.info("MEMORY_OTP_STORED", {
      email,
      expiresAt: expiresAt.toISOString(),
      storeSize: this.store.size,
    });
  }

  /**
   * Verify OTP and return data if valid
   */
  async verifyOTP(
    email: string,
    otp: string
  ): Promise<{ valid: boolean; password?: string; error?: string }> {
    if (this.useRedis && this.redisStore) {
      try {
        return await this.redisStore.verifyOTP(email, otp);
      } catch (error) {
        logger.warn("REDIS_OTP_VERIFY_FAILED_FALLBACK_TO_MEMORY", {
          error,
          email,
        });
        this.useRedis = false;
      }
    }

    // Fallback to in-memory store
    const otpData = this.store.get(email);

    if (!otpData) {
      return { valid: false, error: "No OTP found for this email" };
    }

    if (otpData.otp !== otp) {
      return { valid: false, error: "Invalid OTP" };
    }

    if (otpData.expiresAt < new Date()) {
      // Remove expired OTP
      this.store.delete(email);
      return { valid: false, error: "OTP has expired" };
    }

    // OTP is valid, remove it from store and return password
    const password = otpData.password;
    this.store.delete(email);

    logger.info("MEMORY_OTP_VERIFIED_SUCCESSFULLY", { email });

    return { valid: true, password };
  }

  /**
   * Check if OTP exists for email
   */
  async hasOTP(email: string): Promise<boolean> {
    if (this.useRedis && this.redisStore) {
      try {
        return await this.redisStore.hasOTP(email);
      } catch (error) {
        logger.warn("REDIS_OTP_CHECK_FAILED_FALLBACK_TO_MEMORY", {
          error,
          email,
        });
        this.useRedis = false;
      }
    }

    // Fallback to in-memory store
    const otpData = this.store.get(email);
    if (!otpData) return false;

    // Check if expired
    if (otpData.expiresAt < new Date()) {
      this.store.delete(email);
      return false;
    }

    return true;
  }

  /**
   * Remove OTP for email
   */
  async removeOTP(email: string): Promise<void> {
    if (this.useRedis && this.redisStore) {
      try {
        await this.redisStore.removeOTP(email);
        return;
      } catch (error) {
        logger.warn("REDIS_OTP_REMOVE_FAILED_FALLBACK_TO_MEMORY", {
          error,
          email,
        });
        this.useRedis = false;
      }
    }

    // Fallback to in-memory store
    this.store.delete(email);
    logger.info("MEMORY_OTP_REMOVED", { email });
  }

  /**
   * Clean up expired OTPs (in-memory only)
   */
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [email, otpData] of this.store.entries()) {
      if (otpData.expiresAt < now) {
        this.store.delete(email);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info("MEMORY_OTP_CLEANUP_COMPLETED", {
        cleanedCount,
        remainingOTPs: this.store.size,
      });
    }
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<{
    totalOTPs: number;
    storeSize: number;
    storageType: string;
  }> {
    if (this.useRedis && this.redisStore) {
      try {
        const stats = await this.redisStore.getStats();
        return { ...stats, storageType: "redis" };
      } catch (error) {
        logger.warn("REDIS_OTP_STATS_FAILED_FALLBACK_TO_MEMORY", { error });
        this.useRedis = false;
      }
    }

    // Fallback to in-memory store
    return {
      totalOTPs: this.store.size,
      storeSize: this.store.size,
      storageType: "memory",
    };
  }

  /**
   * Cleanup on shutdown
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.redisStore) {
      await this.redisStore.destroy();
    }

    this.store.clear();
  }

  /**
   * Get current storage type
   */
  getStorageType(): string {
    return this.useRedis ? "redis" : "memory";
  }
}

// Export singleton instance
export const otpStore = new OTPStore();

// Graceful shutdown
process.on("SIGTERM", () => {
  otpStore.destroy();
});

process.on("SIGINT", () => {
  otpStore.destroy();
});
