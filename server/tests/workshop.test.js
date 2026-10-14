import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import User from "../src/models/user.model.js";

let ownerToken, ownerId, ownerEmail;
let memberAToken, memberAId;
let memberBToken;
let workshopId, workshopCode;
let requestId;
let joinCode;

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return { token: res.body.accessToken, body: res.body };
}

function auth(token) {
  return ["Authorization", `Bearer ${token}`];
}

beforeAll(async () => {
  const owner = await registerAndLogin("ownerLife@test.com");
  ownerToken = owner.token;
  ownerId = owner.body.user._id;
  ownerEmail = "ownerLife@test.com";
});

describe("workshop full lifecycle", () => {
  it("register returns user and accessToken", async () => {
    expect(ownerToken).toBeTruthy();
    expect(ownerId).toBeTruthy();
    // Nadie se registra como admin: el rol se define por la acción posterior.
    const registered = await User.findById(ownerId);
    expect(registered.role).toBe("user");
  });

  it("a plain registered user can create a workshop (201)", async () => {
    const res = await request(app)
      .post("/api/workshops")
      .set(...auth(ownerToken))
      .send({ name: "Taller Principal Test" });
    expect(res.status).toBe(201);
    workshopId = res.body._id;
    expect(res.body.owner).toBe(ownerId);
  });

  it("creating a workshop promotes the creator to admin", async () => {
    const owner = await User.findById(ownerId);
    expect(owner.role).toBe("admin");
    expect(String(owner.workshop)).toBe(workshopId);
  });

  it("the original registration token now passes admin-only routes", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
  });

  it("cannot create a second workshop while already belonging to one (409)", async () => {
    const res = await request(app)
      .post("/api/workshops")
      .set(...auth(ownerToken))
      .send({ name: "Segundo Taller Test" });
    expect(res.status).toBe(409);
  });

  it("gets my workshop with an 8-char hex join code (200)", async () => {
    const res = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(workshopId);
    expect(res.body.code).toMatch(/^[A-F0-9]{8}$/);
    workshopCode = res.body.code;
  });

  it("lists members including the owner (200)", async () => {
    const res = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((m) => m.email === ownerEmail.toLowerCase())).toBe(true);
  });

  it("the owner cannot leave their own workshop (400)", async () => {
    const res = await request(app)
      .post("/api/workshops/leave")
      .set(...auth(ownerToken));
    expect(res.status).toBe(400);
  });

  it("a memberless user joins the workshop by code (201)", async () => {
    const memberA = await registerAndLogin("memberLifeA@test.com");
    memberAToken = memberA.token;
    memberAId = memberA.body.user._id;

    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberAToken))
      .send({ code: workshopCode });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
  });

  it("duplicate join while the request is still pending is rejected (409)", async () => {
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberAToken))
      .send({ code: workshopCode });
    expect(res.status).toBe(409);
  });

  it("joins with an invalid code format (400)", async () => {
    const stranger = await registerAndLogin("strangerJoin@test.com");
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(stranger.token))
      .send({ code: "ZYX" });
    expect(res.status).toBe(400);
  });

  it("joins with a well-formed but nonexistent code (404)", async () => {
    const stranger = await registerAndLogin("strangerJoin2@test.com");
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(stranger.token))
      .send({ code: "FFFFFFFF" });
    expect(res.status).toBe(404);
  });

  it("the owner lists pending requests (200)", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const pending = res.body.find((r) => String(r.user._id) === memberAId);
    expect(pending).toBeTruthy();
    requestId = pending._id;
  });

  it("owner approves the request and receives a join code (200)", async () => {
    const res = await request(app)
      .patch(`/api/workshops/requests/${requestId}`)
      .set(...auth(ownerToken))
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
    expect(res.body.code).toBeTruthy();
    joinCode = res.body.code;
  });

  it("the approved user completes registration with the code (200)", async () => {
    const res = await request(app)
      .post("/api/workshops/verify-code")
      .set(...auth(memberAToken))
      .send({ code: joinCode });
    expect(res.status).toBe(200);
    expect(String(res.body._id)).toBe(workshopId);
  });

  it("an already-resolved request cannot be re-approved (400)", async () => {
    const res = await request(app)
      .patch(`/api/workshops/requests/${requestId}`)
      .set(...auth(ownerToken))
      .send({ status: "approved" });
    expect(res.status).toBe(400);
  });

  it("the approved user now appears in the members list", async () => {
    const res = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(ownerToken));
    expect(res.body.some((m) => String(m._id) === memberAId)).toBe(true);
  });

  it("a member (not owner) cannot list the workshop requests (403)", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(memberAToken));
    expect(res.status).toBe(403);
  });

  it("a member cannot join a different workshop while already in one (409)", async () => {
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberAToken))
      .send({ code: workshopCode });
    expect(res.status).toBe(409);
  });

  it("a regular member cannot update the workshop (403)", async () => {
    const res = await request(app)
      .patch(`/api/workshops/${workshopId}`)
      .set(...auth(memberAToken))
      .send({ name: "Hacked Taller Test" });
    expect(res.status).toBe(403);
  });

  it("the owner can update the workshop (200)", async () => {
    const res = await request(app)
      .patch(`/api/workshops/${workshopId}`)
      .set(...auth(ownerToken))
      .send({ name: "Taller Principal Renombrado" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Taller Principal Renombrado");
  });

  it("a member can leave the workshop (200)", async () => {
    const res = await request(app)
      .post("/api/workshops/leave")
      .set(...auth(memberAToken));
    expect(res.status).toBe(200);
  });

  it("a left member can join again (201)", async () => {
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberAToken))
      .send({ code: workshopCode });
    expect(res.status).toBe(201);
  });

  it("owner can remove a pending member (rejects) and the user is out (200)", async () => {
    const requests = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(ownerToken));
    const pending = requests.body.find((r) => String(r.user._id) === memberAId);
    expect(pending).toBeTruthy();

    const res = await request(app)
      .patch(`/api/workshops/requests/${pending._id}`)
      .set(...auth(ownerToken))
      .send({ status: "rejected" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("rejected");
  });

  it("rejected member can reapply with a new request (201)", async () => {
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberAToken))
      .send({ code: workshopCode });
    expect(res.status).toBe(201);
  });

  it("owner adds a member then removes them from the workshop (200)", async () => {
    const memberB = await registerAndLogin("memberLifeB@test.com");
    memberBToken = memberB.token;
    const join = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberBToken))
      .send({ code: workshopCode });
    expect(join.status).toBe(201);

    const approve = await request(app)
      .patch(`/api/workshops/requests/${join.body._id}`)
      .set(...auth(ownerToken))
      .send({ status: "approved" });
    expect(approve.status).toBe(200);

    const verify = await request(app)
      .post("/api/workshops/verify-code")
      .set(...auth(memberBToken))
      .send({ code: approve.body.code });
    expect(verify.status).toBe(200);

    const members = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(ownerToken));
    expect(members.body.some((m) => String(m._id) === memberB.body.user._id)).toBe(true);

    const remove = await request(app)
      .delete(`/api/workshops/${workshopId}/members/${memberB.body.user._id}`)
      .set(...auth(ownerToken));
    expect(remove.status).toBe(200);
  });

  it("the owner cannot be removed (400)", async () => {
    const res = await request(app)
      .delete(`/api/workshops/${workshopId}/members/${ownerId}`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(400);
  });

  it("regenerates the workshop code (200)", async () => {
    const res = await request(app)
      .post(`/api/workshops/${workshopId}/code/regenerate`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.code).toMatch(/^[A-F0-9]{8}$/);
    expect(res.body.code).not.toBe(workshopCode);
  });

  it("the owner deletes the workshop (200)", async () => {
    const res = await request(app)
      .delete(`/api/workshops/${workshopId}`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
  });

  it("after deleting, the former owner can create a brand-new workshop (201)", async () => {
    const res = await request(app)
      .post("/api/workshops")
      .set(...auth(ownerToken))
      .send({ name: "Taller Post Borrado" });
    expect(res.status).toBe(201);
  });
});