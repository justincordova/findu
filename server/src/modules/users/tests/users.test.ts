import request from "supertest";
import app from "@/app"; // Make sure your app exports the Express instance

describe("User Routes", () => {
  it("should create a new user", async () => {
    const uniqueEmail = `test-${Date.now()}@university.edu`;
    const uniqueUsername = `testuser-${Date.now()}`;

    const res = await request(app).post("/api/users").send({
      email: uniqueEmail,
      username: uniqueUsername,
      f_name: "Test",
      l_name: "User",
      password: "TestPass123!",
    });

    console.log("Response status:", res.statusCode);
    console.log("Response body:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("email", uniqueEmail);
    expect(res.body).not.toHaveProperty("password_hash");
  });

  // Add more tests for GET, PATCH, DELETE, etc.
});
