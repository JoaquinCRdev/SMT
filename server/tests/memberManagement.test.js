import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import User from "../src/models/user.model.js";

let ownerToken, ownerId;
let memberToken, memberId;
let secondAdminToken, secondAdminId;
let workshopId, workshopCode;

function auth(token) {
  return ["Authorization", `Bearer ${token}`];
}

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return { token: res.body.accessToken, body: res.body };
}

// Un usuario registrado no entra solo al taller: pasa por el flujo real de
// solicitud + aprobación + código, igual que en la app.
async function joinWorkshop(token, code) {
  const join = await request(app)
    .post("/api/workshops/join")
    .set(...auth(token))
    .send({ code });
  expect(join.status).toBe(201);

  const approve = await request(app)
    .patch(`/api/workshops/requests/${join.body._id}`)
    .set(...auth(ownerToken))
    .send({ status: "approved" });
  expect(approve.status).toBe(200);

  const verify = await request(app)
    .post("/api/workshops/verify-code")
    .set(...auth(token))
    .send({ code: approve.body.code });
  expect(verify.status).toBe(200);
}

beforeAll(async () => {
  const owner = await registerAndLogin("cfgOwner@test.com");
  ownerToken = owner.token;
  ownerId = owner.body.user._id;

  const created = await request(app)
    .post("/api/workshops")
    .set(...auth(ownerToken))
    .send({ name: "Taller Config", address: "Calle 1", phone: "555" });
  expect(created.status).toBe(201);
  workshopId = created.body._id;
  workshopCode = created.body.code;

  const member = await registerAndLogin("cfgMember@test.com");
  memberToken = member.token;
  memberId = member.body.user._id;
  await joinWorkshop(memberToken, workshopCode);

  const secondAdmin = await registerAndLogin("cfgSecondAdmin@test.com");
  secondAdminToken = secondAdmin.token;
  secondAdminId = secondAdmin.body.user._id;
  await joinWorkshop(secondAdminToken, workshopCode);

  // El dueño lo promueve: por join nunca nace admin.
  const promoted = await request(app)
    .patch(`/api/workshops/mine/members/${secondAdminId}`)
    .set(...auth(ownerToken))
    .send({ role: "admin" });
  expect(promoted.status).toBe(200);
});

describe("member management used by the configuration page", () => {
  it("GET /workshops/mine returns the join code used by the page", async () => {
    const res = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(workshopCode);
    // El dueño viene poblado, no como id suelto.
    expect(res.body.owner._id).toBe(ownerId);
  });

  it("adding a member never returns the password hash", async () => {
    const res = await request(app)
      .post("/api/workshops/mine/members")
      .set(...auth(ownerToken))
      .send({
        name: "Miembro Nuevo",
        email: "cfgAdded@test.com",
        password: "12345678",
        role: "user",
      });

    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
    expect(res.body.email).toBe("cfgadded@test.com");
    expect(res.body.isActive).toBe(true);
  });

  it("the added member is listed for the workshop", async () => {
    const res = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(ownerToken));

    expect(res.status).toBe(200);
    const added = res.body.find((m) => m.email === "cfgadded@test.com");
    expect(added).toBeTruthy();
    expect(added.password).toBeUndefined();
  });

  it("updating a member never returns the password hash", async () => {
    const res = await request(app)
      .patch(`/api/workshops/mine/members/${memberId}`)
      .set(...auth(ownerToken))
      .send({ name: "Miembro Editado", password: "nuevacontra1" });

    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
    expect(res.body.name).toBe("Miembro Editado");
  });

  it("the new password actually replaces the old one", async () => {
    const wrong = await request(app)
      .post("/api/login")
      .send({ email: "cfgMember@test.com", password: "12345678" });
    expect(wrong.status).toBe(401);

    const right = await request(app)
      .post("/api/login")
      .send({ email: "cfgMember@test.com", password: "nuevacontra1" });
    expect(right.status).toBe(200);
  });

  it("an admin that is not the owner cannot manage members (403)", async () => {
    const res = await request(app)
      .post("/api/workshops/mine/members")
      .set(...auth(secondAdminToken))
      .send({
        name: "Intruso",
        email: "cfgIntruso@test.com",
        password: "12345678",
      });

    expect(res.status).toBe(403);
  });

  it("a second admin can still read the scoped member list", async () => {
    const res = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(secondAdminToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((m) => m.password === undefined)).toBe(true);
  });

  it("the owner cannot edit or remove themselves (400)", async () => {
    const edit = await request(app)
      .patch(`/api/workshops/mine/members/${ownerId}`)
      .set(...auth(ownerToken))
      .send({ name: "No soy yo" });
    expect(edit.status).toBe(400);

    const remove = await request(app)
      .delete(`/api/workshops/${workshopId}/members/${ownerId}`)
      .set(...auth(ownerToken));
    expect(remove.status).toBe(400);
  });

  it("the owner cannot update a member from another workshop (404)", async () => {
    const outsider = await registerAndLogin("cfgOutsider@test.com");

    const res = await request(app)
      .patch(`/api/workshops/mine/members/${outsider.body.user._id}`)
      .set(...auth(ownerToken))
      .send({ name: "Secuestrado" });

    expect(res.status).toBe(404);
  });

  it("deactivating a member blocks their login (403)", async () => {
    const res = await request(app)
      .patch(`/api/workshops/mine/members/${secondAdminId}`)
      .set(...auth(ownerToken))
      .send({ isActive: false });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post("/api/login")
      .send({ email: "cfgSecondAdmin@test.com", password: "12345678" });
    expect(login.status).toBe(403);
  });

  it("deactivating a member kills the session they already had (403)", async () => {
    const res = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(secondAdminToken));

    expect(res.status).toBe(403);
  });

  it("deactivating a member drops their stored refresh tokens", async () => {
    const stored = await User.findById(secondAdminId).select("+refreshTokens");
    expect(stored.refreshTokens).toEqual([]);
  });

  it("reactivating the member restores their access", async () => {
    const res = await request(app)
      .patch(`/api/workshops/mine/members/${secondAdminId}`)
      .set(...auth(ownerToken))
      .send({ isActive: true });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post("/api/login")
      .send({ email: "cfgSecondAdmin@test.com", password: "12345678" });
    expect(login.status).toBe(200);

    secondAdminToken = login.body.accessToken;

    const profile = await request(app)
      .get("/api/profile")
      .set(...auth(secondAdminToken));
    expect(profile.status).toBe(200);
  });

  it("an access token for a deleted user is rejected (401)", async () => {
    const ghost = await registerAndLogin("cfgGhost@test.com");
    const token = ghost.token;
    const id = ghost.body.user._id;

    await User.findByIdAndDelete(id);

    const res = await request(app)
      .get("/api/profile")
      .set(...auth(token));
    expect(res.status).toBe(401);
  });

  it("removing a member detaches them without deleting the account", async () => {
    const res = await request(app)
      .delete(`/api/workshops/${workshopId}/members/${memberId}`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);

    const detached = await User.findById(memberId);
    expect(detached).toBeTruthy();
    expect(detached.workshop).toBeNull();

    // Y puede volver a entrar con el código del taller.
    const rejoin = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberToken))
      .send({ code: workshopCode });
    expect(rejoin.status).toBe(201);
  });

  it("a member cannot see the requests of a workshop they do not own", async () => {
    const other = await registerAndLogin("cfgOtherOwner@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(other.token))
      .send({ name: "Taller Ajeno" });

    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(memberToken));
    expect(res.status).toBe(403);
  });
});
