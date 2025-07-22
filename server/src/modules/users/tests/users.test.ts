import request from "supertest";
import app from "@/app"; // Make sure your app exports the Express instance

// Ensure route protection is disabled for tests
beforeAll(() => {
  process.env.DISABLE_USER_ROUTE_PROTECTION = "true";
});

describe("User Routes", () => {
  let createdUserId: string;
  const testEmail = `testuser-${Date.now()}@university.edu`;
  const testUsername = `testuser-${Date.now()}`;

  it("should create a new user", async () => {
    const res = await request(app).post("/api/users").send({
      email: testEmail,
      username: testUsername,
      f_name: "Test",
      l_name: "User",
      password: "TestPass123!",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("email", testEmail);
    expect(res.body).not.toHaveProperty("hashed_password");
    createdUserId = res.body.id;
  });

  it("should get all users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should get a user by id", async () => {
    const res = await request(app).get(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", createdUserId);
    expect(res.body).toHaveProperty("email", testEmail);
  });

  it("should update a user", async () => {
    const res = await request(app)
      .patch(`/api/users/${createdUserId}`)
      .send({ f_name: "Updated", l_name: "User" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("f_name", "Updated");
    expect(res.body).toHaveProperty("l_name", "User");
  });

  it("should delete a user", async () => {
    const res = await request(app).delete(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User deleted successfully");
  });

  it("should return 404 for deleted user", async () => {
    const res = await request(app).get(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(404);
  });
});
