// tests/user.test.js

import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import User from "../src/models/user.model.js";
import { app } from "./setup.js";

vi.mock("../src/utils/email.js", () => ({
  sendResetEmail: vi.fn(),
}));

let accessToken;
let cookie;
describe("POST /api/register", () => {
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ name: "Raul", email: "raul@test.com", password: "12345678" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user.name).toBe("Raul");
    expect(res.body.user.email).toBe("raul@test.com");
    expect(res.body).not.toHaveProperty("password");
  });
  it("should reject duplicate email", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ name: "Raul", email: "raul@test.com", password: "12345678" });
    expect(res.status).toBe(409);
  });
  it("should reject invalid data", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ name: "", email: "notanemail", password: "123" });
    expect(res.status).toBe(400);
  });
});
describe("POST /api/login", () => {
  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "raul@test.com", password: "12345678" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("user");
    accessToken = res.body.accessToken;
    cookie = res.headers["set-cookie"];
  });
  it("should reject wrong password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "raul@test.com", password: "wrong" });
    expect(res.status).toBe(401);
  });
  it("should reject non-existent email", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "nobody@test.com", password: "12345678" });
    expect(res.status).toBe(401);
  });
});
describe("GET /api/profile", () => {
  it("should return profile with valid token", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("raul@test.com");
  });
  it("should reject without token", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
  });
});
describe("POST /api/refresh", () => {
  it("should return new access token using cookie", async () => {
    const res = await request(app).post("/api/refresh").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });
  it("should reject without cookie", async () => {
    const res = await request(app).post("/api/refresh");
    expect(res.status).toBe(401);
  });
});
describe("POST /api/logout", () => {
  it("should logout successfully", async () => {
    const res = await request(app)
      .post("/api/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out");
    // Verify refresh token was removed — should fail now
    const refreshRes = await request(app)
      .post("/api/refresh")
      .set("Cookie", cookie);
    expect(refreshRes.status).toBe(401);
  });
});
describe("GET /api/users (admin only)", () => {
  it("should reject non-admin user", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
  it("should allow admin user", async () => {
    await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: "admin123",
      role: "admin",
    });
    const loginRes = await request(app)
      .post("/api/login")
      .send({ email: "admin@test.com", password: "admin123" });
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});
describe("POST /api/forgot-password", () => {
  it("should send a password reset email", async () => {
    const res = await request(app)
      .post("/api/forgot-password")
      .send({ email: "raul@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("If that user exists a code will be sent");
  });
  it("should save the reset token in the database", async () => {
    const user = await User.findOne({ email: "raul@test.com" }).select(
      "+resetPasswordToken +resetPasswordExpires",
    );
    expect(user).toBeDefined();
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordExpires).toBeDefined();
  });
  it("should send a no error message when an invalid mail is sent", async () => {
    const res = await request(app)
      .post("/api/forgot-password")
      .send({ email: "nobody@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("If that user exists a code will be sent");
  });
  it("should reset the password with a valid token", async () => {
    const user = await User.findOne({ email: "raul@test.com" }).select(
      "+resetPasswordToken +resetPasswordExpires",
    );
    const rawToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: rawToken, newPassword: "newPassword" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset successfully");

    const loginRes = await request(app)
      .post("/api/login")
      .send({ email: "raul@test.com", password: "newPassword" });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty("accessToken");
  });
  it("should reject with an invalid token", async () => {
    const user = await User.findOne({ email: "raul@test.com" }).select(
      "+resetPasswordToken +resetPasswordExpires",
    );
    const rawToken = user.generateResetToken();
    user.resetPasswordExpires = new Date(Date.now() - 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: rawToken, newPassword: "newpass456" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or expired token");
  });
  it("should reject an invalid token", async () => {
    const res = await request(app).post("/api/reset-password").send({
      token: "thisisacompletelyinvalidtoken",
      newPassword: "newpass456",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or expired token");
  });
  it("should reject a token that has already been used", async () => {
    const user = await User.findOne({ email: "raul@test.com" }).select(
      "+resetPasswordToken +resetPasswordExpires",
    );
    const rawToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });
    await request(app)
      .post("/api/reset-password")
      .send({ token: rawToken, newPassword: "usedonce123" });
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: rawToken, newPassword: "usedtwice123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or expired token");
  });
});
