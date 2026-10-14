import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import User from "../src/models/user.model.js";

let adminToken, userToken, userId, outsiderToken;
let workshopId;

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return { token: res.body.accessToken, id: res.body.user._id };
}

function auth(token) {
  return ["Authorization", `Bearer ${token}`];
}

beforeAll(async () => {
  // El admin no puede ascender por registro: se promueve en la base y luego
  // crea un taller, que es la única vía legítima para obtener el rol.
  const admin = await registerAndLogin("roleAdmin@test.com");
  await User.findByIdAndUpdate(admin.id, { role: "admin" });
  adminToken = admin.token;

  const created = await request(app)
    .post("/api/workshops")
    .set(...auth(adminToken))
    .send({ name: "Taller Roles Test" });
  workshopId = created.body._id;

  const user = await registerAndLogin("roleuser@test.com");
  userId = user.id;
  userToken = user.token;

  // El usuario regular queda dentro del taller. addMember rechaza emails ya
  // registrados, así que el alta se hace directo en la base: lo que se prueba
  // acá es el rol leído de la DB, no el flujo de invitación.
  await User.findByIdAndUpdate(userId, { workshop: workshopId });

  // Un segundo taller, para comprobar el aislamiento de /api/users.
  const outsider = await registerAndLogin("roleoutsider@test.com");
  await User.findByIdAndUpdate(outsider.id, { role: "admin" });
  outsiderToken = outsider.token;
  await request(app)
    .post("/api/workshops")
    .set(...auth(outsiderToken))
    .send({ name: "Taller Ajeno Test" });
});

describe("registration never grants admin", () => {
  it("ignores a role field sent in the register body (201, role=user)", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        name: "Escalation",
        email: "escalation@test.com",
        password: "12345678",
        role: "admin",
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");

    const persisted = await User.findById(res.body.user._id);
    expect(persisted.role).toBe("user");
  });
});

describe("GET /api/users is workshop-scoped", () => {
  it("admin can list their workshop members (200)", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(...auth(adminToken));
    expect(res.status).toBe(200);
  });

  it("never returns members of another workshop", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(...auth(adminToken));

    const emails = res.body.map((u) => u.email);
    expect(emails).toContain("roleuser@test.com");
    expect(emails).not.toContain("roleoutsider@test.com");
  });

  it("does not leak sensitive fields", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(...auth(adminToken));

    for (const u of res.body) {
      expect(u).not.toHaveProperty("password");
      expect(u).not.toHaveProperty("refreshToken");
    }
  });

  it("admin from another workshop only sees their own members", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(...auth(outsiderToken));

    expect(res.status).toBe(200);
    const emails = res.body.map((u) => u.email);
    expect(emails).toContain("roleoutsider@test.com");
    expect(emails).not.toContain("roleuser@test.com");
  });

  it("regular user cannot list users (403)", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(...auth(userToken));
    expect(res.status).toBe(403);
  });
});

describe("role is read from the database, not the JWT", () => {
  it("promoting a user to admin takes effect immediately (old JWT still valid)", async () => {
    await User.findByIdAndUpdate(userId, { role: "admin" });

    const res = await request(app)
      .get("/api/users")
      .set(...auth(userToken));
    expect(res.status).toBe(200);

    await User.findByIdAndUpdate(userId, { role: "user" });
  });

  it("demoting back to user restores the 403", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(...auth(userToken));
    expect(res.status).toBe(403);
  });
});
