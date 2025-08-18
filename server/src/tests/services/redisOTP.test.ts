import { RedisOTPStore } from "@/services/redisOTPStore";
import Redis from "ioredis";

jest.mock("ioredis");

describe("RedisOTPStore", () => {
  let store: RedisOTPStore;
  let redisMock: jest.Mocked<Redis>;
  const testEmail = "student@university.edu";

  beforeEach(() => {
    redisMock = new Redis() as jest.Mocked<Redis>;

    // Mock Redis methods
    redisMock.setex = jest.fn().mockResolvedValue("OK");
    redisMock.get = jest.fn();
    redisMock.del = jest.fn().mockResolvedValue(1);
    redisMock.exists = jest.fn().mockResolvedValue(1);
    redisMock.keys = jest.fn().mockResolvedValue([]);
    redisMock.quit = jest.fn().mockResolvedValue("OK");

    // Mock event listener for "connect"
    (redisMock.on as jest.Mock).mockImplementation((event, cb) => {
      if (event === "connect") cb();
      return redisMock;
    });

    store = new RedisOTPStore();
    store["redis"] = redisMock;
    store["isConnected"] = true;
  });

  afterEach(async () => {
    await store.destroy();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should store OTP in Redis", async () => {
    await store.storeOTP(testEmail, "123456", "password", 600);
    expect(redisMock.setex).toHaveBeenCalledWith(`otp:${testEmail}`, 600, expect.any(String));
  });

  it("should verify OTP successfully", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({
      otp: "123456",
      email: testEmail,
      password: "password",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    }));
    const result = await store.verifyOTP(testEmail, "123456");
    expect(result.valid).toBe(true);
    expect(result.password).toBe("password");
    expect(redisMock.del).toHaveBeenCalledWith(`otp:${testEmail}`);
  });

  it("should fail verification for wrong OTP", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({
      otp: "654321",
      email: testEmail,
      password: "password",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    }));
    const result = await store.verifyOTP(testEmail, "123456");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid OTP");
  });

  it("should fail verification for expired OTP", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({
      otp: "123456",
      email: testEmail,
      password: "password",
      expiresAt: Math.floor(Date.now() / 1000) - 10,
    }));
    const result = await store.verifyOTP(testEmail, "123456");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("OTP has expired");
  });

  it("should check if OTP exists", async () => {
    redisMock.exists.mockResolvedValue(1);
    expect(await store.hasOTP(testEmail)).toBe(true);
    redisMock.exists.mockResolvedValue(0);
    expect(await store.hasOTP(testEmail)).toBe(false);
  });

  it("should remove OTP", async () => {
    await store.removeOTP(testEmail);
    expect(redisMock.del).toHaveBeenCalledWith(`otp:${testEmail}`);
  });

  it("should return stats with storageType", async () => {
    redisMock.keys.mockResolvedValue(["otp:1", "otp:2", "otp:3"]);
    const stats = await store.getStats();
    expect(stats.totalOTPs).toBe(3);
    expect(stats.storeSize).toBe(3);
    expect(stats.storageType).toBe("redis");
  });

  it("should quit Redis on destroy", async () => {
    await store.destroy();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
