import { OTPStore } from "@/providers/redis";
import Redis from "ioredis";

jest.mock("ioredis");

describe("OTPStore", () => {
  let store: OTPStore;
  let redisMock: jest.Mocked<Redis>;
  const testEmail = "student@university.edu";

  beforeAll(() => {
    jest.useFakeTimers(); // for expiration tests
  });

  beforeEach(() => {
    store = new OTPStore();

    // Force Redis to "connected" for some tests
    store["isConnected"] = true;
    store["useRedis"] = true;

    // Clear memory store before each test
    store["store"].clear();

    // Full Redis mock
    redisMock = store["redis"] as jest.Mocked<Redis>;
    redisMock.setex = jest.fn().mockResolvedValue("OK");
    redisMock.get = jest.fn();
    redisMock.del = jest.fn().mockResolvedValue(1);
    redisMock.exists = jest.fn().mockResolvedValue(1);
    redisMock.keys = jest.fn().mockResolvedValue([]);
    redisMock.quit = jest.fn().mockResolvedValue("OK");
  });

  afterEach(async () => {
    await store.destroy(); // ensure Redis client is closed
    jest.clearAllMocks();
    store["store"].clear();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should store OTP in Redis if Redis is ready", async () => {
    await store.storeOTP(testEmail, "123456", "password", 600);
    expect(redisMock.setex).toHaveBeenCalledWith(
      `otp:${testEmail}`,
      600,
      expect.any(String)
    );
  });

  it("should fallback to memory if Redis fails", async () => {
    redisMock.setex.mockRejectedValueOnce(new Error("Redis down"));
    await store.storeOTP(testEmail, "123456", "password", 600);
    expect(store["store"].has(testEmail)).toBe(true);
  });

  it("should verify OTP via Redis if available", async () => {
    redisMock.get.mockResolvedValue(
      JSON.stringify({
        otp: "123456",
        email: testEmail,
        password: "password",
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      })
    );
    redisMock.del.mockResolvedValue(1);

    const result = await store.verifyOTP(testEmail, "123456");
    expect(result.valid).toBe(true);
    expect(result.password).toBe("password");
    expect(redisMock.del).toHaveBeenCalledWith(`otp:${testEmail}`);
  });

  it("should fallback to memory verification if Redis fails", async () => {
    store["store"].set(testEmail, {
      otp: "123456",
      email: testEmail,
      password: "password",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    });
    store["useRedis"] = false;

    const result = await store.verifyOTP(testEmail, "123456");
    expect(result.valid).toBe(true);
    expect(result.password).toBe("password");
  });

  it("should fail verification for wrong OTP", async () => {
    redisMock.get.mockResolvedValue(
      JSON.stringify({
        otp: "654321",
        email: testEmail,
        password: "password",
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      })
    );

    const result = await store.verifyOTP(testEmail, "123456");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid OTP");
  });

  it("should fail verification for expired OTP", async () => {
    redisMock.get.mockResolvedValue(
      JSON.stringify({
        otp: "123456",
        email: testEmail,
        password: "password",
        expiresAt: Math.floor(Date.now() / 1000) - 10,
      })
    );
    redisMock.del.mockResolvedValue(1);

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

  it("should get stats from Redis if available", async () => {
    redisMock.keys.mockResolvedValue(["otp:1", "otp:2", "otp:3"]);

    const stats = await store.getStats();
    expect(stats.totalOTPs).toBe(3);
    expect(stats.storeSize).toBe(3);
    expect(stats.storageType).toBe("redis");
  });

  it("should fallback to memory stats if Redis fails", async () => {
    store["store"].set("a@university.edu", {
      otp: "1",
      email: "a@university.edu",
      password: "p",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    });
    store["store"].set("b@college.edu", {
      otp: "2",
      email: "b@college.edu",
      password: "p",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    });
    store["useRedis"] = false;

    const stats = await store.getStats();
    expect(stats.totalOTPs).toBe(2);
    expect(stats.storeSize).toBe(2);
    expect(stats.storageType).toBe("memory");
  });

  it("should quit Redis on destroy", async () => {
    await store.destroy();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
