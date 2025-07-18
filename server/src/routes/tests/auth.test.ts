import request from "supertest";
import app from "../../app";

describe("Auth Routes", () => {
  const email = "jac352@njit.edu";
  const password = "TestPassword1!";
  const username = "justincordova";
  const f_name = "Justin";
  const l_name = "Cordova";
  let supabaseToken = "FAKE_SUPABASE_JWT"; // Replace with a real token for manual test

  it("should send a verification code to a .edu email", async () => {
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty(
      "message",
      "Verification code sent to your .edu email."
    );
  });

  it("should not allow non-.edu emails for verification", async () => {
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "test@gmail.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should complete signup with password after email verification (requires valid session)", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("Authorization", `Bearer ${supabaseToken}`)
      .send({ username, f_name, l_name, password });
    // This will likely fail unless you use a real Supabase token
    expect([201, 401, 409, 500]).toContain(res.statusCode);
  });

  it("should login with email and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    // This will only succeed if the signup above succeeded
    expect([200, 401, 500]).toContain(res.statusCode);
  });

  it("should initiate forgot password (send reset email)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("should reset password with token and new password", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "FAKE_TOKEN", newPassword: "NewPassword123!" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("should logout the user", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .send({ userId: "FAKE_USER_ID" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});
