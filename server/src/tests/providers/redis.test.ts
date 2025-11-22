import { Redis } from "@/providers/redis";
import RedisClient from "ioredis";
import logger from "@/config/logger";

// Mock ioredis and logger
jest.mock("ioredis");
jest.mock("@/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("Redis Provider", () => {
  let redisInstance: Redis;
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh Redis instance for each test
    redisInstance = new Redis();
    // Get the mock instance
    const mockInstances = (RedisClient as jest.MockedClass<typeof RedisClient>).mock.instances;
    if (mockInstances.length > 0) {
      mockRedisClient = mockInstances[mockInstances.length - 1];
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor and Event Handlers", () => {
    it("should initialize Redis client with correct configuration", () => {
      expect(RedisClient).toHaveBeenCalledWith({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0"),
      });
    });

    it("should handle connect event and set connection state", () => {
      // Test that event handlers are registered
      expect(mockRedisClient.on).toHaveBeenCalledWith("connect", expect.any(Function));
      // Get the connect handler and call it
      const connectCall = (mockRedisClient.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === "connect"
      );
      if (connectCall && connectCall[1]) {
        connectCall[1](); // Trigger connect handler
        expect(logger.info).toHaveBeenCalledWith("REDIS_STORE_CONNECTED");
      }
    });

    it("should handle error event and log error", () => {
      const error = new Error("Connection failed");
      // Get the error handler and call it
      const errorCall = (mockRedisClient.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === "error"
      );
      if (errorCall && errorCall[1]) {
        errorCall[1](error); // Trigger error handler
        expect(logger.error).toHaveBeenCalledWith("REDIS_STORE_ERROR", {
          error: error.message,
        });
      }
    });

    it("should handle close event and log warning", () => {
      // Get the close handler and call it
      const closeCall = (mockRedisClient.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === "close"
      );
      if (closeCall && closeCall[1]) {
        closeCall[1](); // Trigger close handler
        expect(logger.warn).toHaveBeenCalledWith("REDIS_STORE_DISCONNECTED");
      }
    });
  });

  describe("storeOTP", () => {
    const email = "test@example.com";
    const otp = "123456";
    const password = "hashedPassword";
    const expiresInSeconds = 600;

    it("should store OTP in Redis when connected", async () => {
      // Mock Redis as connected
      (mockRedisClient.setex as jest.Mock) = jest.fn().mockResolvedValue("OK");
      // Manually set connection state (we'll need to access private properties via reflection or make them testable)
      // For now, we'll test the fallback behavior when Redis is not connected
      
      // Test with Redis connected
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      // Access the private redis property
      const redisProperty = (redisInstance as any).redis;
      redisProperty.setex = jest.fn().mockResolvedValue("OK");

      await redisInstance.storeOTP(email, otp, password, expiresInSeconds);

      expect(redisProperty.setex).toHaveBeenCalledWith(
        `otp:${email}`,
        expiresInSeconds,
        expect.stringContaining(otp)
      );
      expect(logger.info).toHaveBeenCalledWith(
        "REDIS_OTP_STORED",
        expect.objectContaining({
          email,
        })
      );
    });

    it("should fallback to memory store when Redis fails", async () => {
      // Mock Redis as connected but setex fails
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.setex = jest.fn().mockRejectedValue(new Error("Redis error"));

      await redisInstance.storeOTP(email, otp, password, expiresInSeconds);

      expect(logger.error).toHaveBeenCalledWith("REDIS_OTP_STORE_FAILED", {
        error: expect.any(Error),
        email,
      });
      // Should fallback to memory store
      const store = (redisInstance as any).store;
      expect(store.has(email)).toBe(true);
    });

    it("should use memory store when Redis is not connected", async () => {
      // Mock Redis as not connected
      Object.defineProperty(redisInstance, "useRedis", { value: false, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: false, writable: true, configurable: true });

      await redisInstance.storeOTP(email, otp, password, expiresInSeconds);

      const store = (redisInstance as any).store;
      const storedData = store.get(email);
      expect(storedData).toBeDefined();
      expect(storedData.otp).toBe(otp);
      expect(storedData.email).toBe(email);
      expect(storedData.password).toBe(password);
    });
  });

  describe("verifyOTP", () => {
    const email = "test@example.com";
    const otp = "123456";
    const password = "hashedPassword";

    it("should verify OTP successfully from Redis", async () => {
      const otpData = { otp, email, password, expiresAt: Math.floor(Date.now() / 1000) + 600 };
      
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.get = jest.fn().mockResolvedValue(JSON.stringify(otpData));
      redisProperty.del = jest.fn().mockResolvedValue(1);

      const result = await redisInstance.verifyOTP(email, otp);

      expect(result.valid).toBe(true);
      expect(result.password).toBe(password);
      expect(redisProperty.get).toHaveBeenCalledWith(`otp:${email}`);
      expect(redisProperty.del).toHaveBeenCalledWith(`otp:${email}`);
    });

    it("should return invalid when OTP not found in Redis", async () => {
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.get = jest.fn().mockResolvedValue(null);

      const result = await redisInstance.verifyOTP(email, otp);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("No OTP found for this email");
    });

    it("should return invalid when OTP is incorrect", async () => {
      const otpData = { otp: "wrong-otp", email, password, expiresAt: Math.floor(Date.now() / 1000) + 600 };
      
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.get = jest.fn().mockResolvedValue(JSON.stringify(otpData));

      const result = await redisInstance.verifyOTP(email, otp);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid OTP");
    });

    it("should return invalid when OTP has expired", async () => {
      const otpData = { otp, email, password, expiresAt: Math.floor(Date.now() / 1000) - 100 }; // Expired
      
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.get = jest.fn().mockResolvedValue(JSON.stringify(otpData));
      redisProperty.del = jest.fn().mockResolvedValue(1);

      const result = await redisInstance.verifyOTP(email, otp);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("OTP has expired");
      expect(redisProperty.del).toHaveBeenCalledWith(`otp:${email}`);
    });

    it("should verify OTP from memory store when Redis is not connected", async () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 600;
      const store = (redisInstance as any).store;
      store.set(email, { otp, email, password, expiresAt });

      Object.defineProperty(redisInstance, "useRedis", { value: false, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: false, writable: true, configurable: true });

      const result = await redisInstance.verifyOTP(email, otp);

      expect(result.valid).toBe(true);
      expect(result.password).toBe(password);
      expect(store.has(email)).toBe(false); // Should be deleted after verification
    });

    it("should fallback to memory when Redis fails", async () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 600;
      const store = (redisInstance as any).store;
      store.set(email, { otp, email, password, expiresAt });

      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.get = jest.fn().mockRejectedValue(new Error("Redis error"));

      const result = await redisInstance.verifyOTP(email, otp);

      expect(result.valid).toBe(true);
      expect(result.password).toBe(password);
    });
  });

  describe("hasOTP", () => {
    const email = "test@example.com";

    it("should return true when OTP exists in Redis", async () => {
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.exists = jest.fn().mockResolvedValue(1);

      const result = await redisInstance.hasOTP(email);

      expect(result).toBe(true);
      expect(redisProperty.exists).toHaveBeenCalledWith(`otp:${email}`);
    });

    it("should return false when OTP does not exist in Redis", async () => {
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.exists = jest.fn().mockResolvedValue(0);

      const result = await redisInstance.hasOTP(email);

      expect(result).toBe(false);
    });

    it("should check memory store when Redis is not connected", async () => {
      const store = (redisInstance as any).store;
      store.set(email, { otp: "123456", email, password: "pwd", expiresAt: Date.now() });

      Object.defineProperty(redisInstance, "useRedis", { value: false, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: false, writable: true, configurable: true });

      const result = await redisInstance.hasOTP(email);

      expect(result).toBe(true);
    });

    it("should fallback to memory when Redis fails", async () => {
      const store = (redisInstance as any).store;
      store.set(email, { otp: "123456", email, password: "pwd", expiresAt: Date.now() });

      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.exists = jest.fn().mockRejectedValue(new Error("Redis error"));

      const result = await redisInstance.hasOTP(email);

      expect(result).toBe(true);
    });
  });

  describe("removeOTP", () => {
    const email = "test@example.com";

    it("should remove OTP from Redis when connected", async () => {
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.del = jest.fn().mockResolvedValue(1);

      await redisInstance.removeOTP(email);

      expect(redisProperty.del).toHaveBeenCalledWith(`otp:${email}`);
    });

    it("should remove OTP from memory store when Redis is not connected", async () => {
      const store = (redisInstance as any).store;
      store.set(email, { otp: "123456", email, password: "pwd", expiresAt: Date.now() });

      Object.defineProperty(redisInstance, "useRedis", { value: false, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: false, writable: true, configurable: true });

      await redisInstance.removeOTP(email);

      expect(store.has(email)).toBe(false);
    });

    it("should fallback to memory when Redis fails", async () => {
      const store = (redisInstance as any).store;
      store.set(email, { otp: "123456", email, password: "pwd", expiresAt: Date.now() });

      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.del = jest.fn().mockRejectedValue(new Error("Redis error"));

      await redisInstance.removeOTP(email);

      expect(store.has(email)).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return stats from Redis when connected", async () => {
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.keys = jest.fn().mockResolvedValue(["otp:email1", "otp:email2", "otp:email3"]);

      const stats = await redisInstance.getStats();

      expect(stats).toEqual({
        totalOTPs: 3,
        storeSize: 3,
        storageType: "redis",
      });
      expect(redisProperty.keys).toHaveBeenCalledWith("otp:*");
    });

    it("should return stats from memory store when Redis is not connected", async () => {
      const store = (redisInstance as any).store;
      store.set("email1", {});
      store.set("email2", {});

      Object.defineProperty(redisInstance, "useRedis", { value: false, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: false, writable: true, configurable: true });

      const stats = await redisInstance.getStats();

      expect(stats).toEqual({
        totalOTPs: 2,
        storeSize: 2,
        storageType: "memory",
      });
    });

    it("should fallback to memory when Redis fails", async () => {
      const store = (redisInstance as any).store;
      store.set("email1", {});

      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });
      
      const redisProperty = (redisInstance as any).redis;
      redisProperty.keys = jest.fn().mockRejectedValue(new Error("Redis error"));

      const stats = await redisInstance.getStats();

      expect(stats).toEqual({
        totalOTPs: 1,
        storeSize: 1,
        storageType: "memory",
      });
    });
  });

  describe("destroy", () => {
    it("should quit Redis connection", async () => {
      const redisProperty = (redisInstance as any).redis;
      redisProperty.quit = jest.fn().mockResolvedValue("OK");

      await redisInstance.destroy();

      expect(redisProperty.quit).toHaveBeenCalled();
    });
  });

  describe("isReady", () => {
    it("should return true when Redis is connected and ready", () => {
      Object.defineProperty(redisInstance, "useRedis", { value: true, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });

      expect(redisInstance.isReady()).toBe(true);
    });

    it("should return false when Redis is not connected", () => {
      Object.defineProperty(redisInstance, "useRedis", { value: false, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: false, writable: true, configurable: true });

      expect(redisInstance.isReady()).toBe(false);
    });

    it("should return false when useRedis is false even if connected", () => {
      Object.defineProperty(redisInstance, "useRedis", { value: false, writable: true, configurable: true });
      Object.defineProperty(redisInstance, "isConnected", { value: true, writable: true, configurable: true });

      expect(redisInstance.isReady()).toBe(false);
    });
  });
});

