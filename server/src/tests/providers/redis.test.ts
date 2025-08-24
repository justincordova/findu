import { redis as RedisInstance } from "@/providers/redis"; // renamed
import RedisClient from "ioredis";

// Mock logger to prevent actual logs
jest.mock("@/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Mock ioredis to avoid real Redis connections during tests
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    setex: jest.fn().mockResolvedValue("OK"),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue("OK"),
    on: jest.fn(),
  }));
});

describe("Redis OTP Store", () => {
  const testEmail = "test@example.com";
  const testOTP = "123456";
  const testPassword = "Password123!";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should store OTP in memory if Redis is not ready", async () => {
    // Force fallback to memory
    (RedisInstance as any).useRedis = false;

    await RedisInstance.storeOTP(testEmail, testOTP, testPassword, 5);
    const hasOtp = await RedisInstance.hasOTP(testEmail);
    expect(hasOtp).toBe(true);
  });

  it("should verify a valid OTP", async () => {
    (RedisInstance as any).useRedis = false;
    await RedisInstance.storeOTP(testEmail, testOTP, testPassword, 5);

    const result = await RedisInstance.verifyOTP(testEmail, testOTP);
    expect(result.valid).toBe(true);
    expect(result.password).toBe(testPassword);
  });

  it("should fail verification for invalid OTP", async () => {
    (RedisInstance as any).useRedis = false;
    await RedisInstance.storeOTP(testEmail, testOTP, testPassword, 5);

    const result = await RedisInstance.verifyOTP(testEmail, "wrong-otp");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid OTP");
  });

  it("should fail verification for expired OTP", async () => {
    (RedisInstance as any).useRedis = false;
    await RedisInstance.storeOTP(testEmail, testOTP, testPassword, -1); // expired

    const result = await RedisInstance.verifyOTP(testEmail, testOTP);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("OTP has expired");
  });

  it("should remove OTP correctly", async () => {
    (RedisInstance as any).useRedis = false;
    await RedisInstance.storeOTP(testEmail, testOTP, testPassword, 5);

    await RedisInstance.removeOTP(testEmail);
    const hasOtp = await RedisInstance.hasOTP(testEmail);
    expect(hasOtp).toBe(false);
  });

  it("should return stats correctly for memory store", async () => {
    (RedisInstance as any).useRedis = false;
    await RedisInstance.storeOTP(testEmail, testOTP, testPassword, 5);

    const stats = await RedisInstance.getStats();
    expect(stats.totalOTPs).toBe(1);
    expect(stats.storeSize).toBe(1);
    expect(stats.storageType).toBe("memory");
  });

  it("should mark Redis as ready when connected", () => {
    (RedisInstance as any).isConnected = true;
    (RedisInstance as any).useRedis = true;
    expect(RedisInstance.isReady()).toBe(true);
  });

  it("should destroy Redis connection", async () => {
    const quitSpy = jest.spyOn((RedisInstance as any).redis, "quit");
    await RedisInstance.destroy();
    expect(quitSpy).toHaveBeenCalled();
  });
});
