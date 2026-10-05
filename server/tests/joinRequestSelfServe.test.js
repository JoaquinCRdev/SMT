import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return { token: res.body.accessToken, user: res.body.user };
}

function auth(token) {
  return ["Authorization", `Bearer ${token}`];
}

let ownerToken;
let workshopCode;
let pendingToken;
let approvedToken;
let completedToken;
let approvedRequestId;

beforeAll(async () => {
  const owner = await registerAndLogin("selfServeOwner@test.com");
  ownerToken = owner.token;

  const created = await request(app)
    .post("/api/workshops")
    .set(...auth(ownerToken))
    .send({ name: "Taller Self Serve Test" });
  workshopCode = created.body.code;

  // --- solicitante 1: queda approved ---
  const pending = await registerAndLogin("selfServeApproved@test.com");
  pendingToken = pending.token;
  const join1 = await request(app)
    .post("/api/workshops/join")
    .set(...auth(pendingToken))
    .send({ code: workshopCode });
  approvedRequestId = join1.body._id;
  const approved = await request(app)
    .patch(`/api/workshops/requests/${approvedRequestId}`)
    .set(...auth(ownerToken))
    .send({ status: "approved" });
  approvedToken = approved.body.code;

  // --- solicitante 2: llega a completed ---
  const soon = await registerAndLogin("selfServeCompleted@test.com");
  completedToken = soon.token;
  const join2 = await request(app)
    .post("/api/workshops/join")
    .set(...auth(completedToken))
    .send({ code: workshopCode });
  const resolved2 = await request(app)
    .patch(`/api/workshops/requests/${join2.body._id}`)
    .set(...auth(ownerToken))
    .send({ status: "approved" });
  await request(app)
    .post("/api/workshops/verify-code")
    .set(...auth(completedToken))
    .send({ code: resolved2.body.code });
});

describe("GET /api/workshops/requests/mine", () => {
  it("exists and no longer 500s for a user with no request", async () => {
    const lonely = await registerAndLogin("selfServeLonely@test.com");
    const res = await request(app)
      .get("/api/workshops/requests/mine")
      .set(...auth(lonely.token));

    // Antes esto reventaba con "getMyRequest is not a function".
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("returns the pending request with no code", async () => {
    const joiner = await registerAndLogin("selfServePending@test.com");
    await request(app)
      .post("/api/workshops/join")
      .set(...auth(joiner.token))
      .send({ code: workshopCode });

    const res = await request(app)
      .get("/api/workshops/requests/mine")
      .set(...auth(joiner.token));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
    expect(res.body.code).toBeNull();
  });

  it("hands the code back to the approved requester (self-serve)", async () => {
    const res = await request(app)
      .get("/api/workshops/requests/mine")
      .set(...auth(pendingToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
    expect(res.body.code).toBe(approvedToken);
    expect(res.body.workshop?.name).toBe("Taller Self Serve Test");
  });

  it("returns the completed request with its code already nulled", async () => {
    const res = await request(app)
      .get("/api/workshops/requests/mine")
      .set(...auth(completedToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.code).toBeNull();
  });

  it("never shows one user the request of another", async () => {
    const intruder = await registerAndLogin("selfServeIntruder@test.com");
    const res = await request(app)
      .get("/api/workshops/requests/mine")
      .set(...auth(intruder.token));

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("the approved code from /mine is the one verify-code accepts", async () => {
    const mine = await request(app)
      .get("/api/workshops/requests/mine")
      .set(...auth(pendingToken));

    const res = await request(app)
      .post("/api/workshops/verify-code")
      .set(...auth(pendingToken))
      .send({ code: mine.body.code });

    expect(res.status).toBe(200);
  });
});

describe("GET /api/workshops/requests", () => {
  it("lists pending, approved and completed requests", async () => {
    // Un approved propio: las pruebas de self-serve consumieron los suyos.
    const fresh = await registerAndLogin("selfServeListApproved@test.com");
    const join = await request(app)
      .post("/api/workshops/join")
      .set(...auth(fresh.token))
      .send({ code: workshopCode });
    await request(app)
      .patch(`/api/workshops/requests/${join.body._id}`)
      .set(...auth(ownerToken))
      .send({ status: "approved" });

    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(ownerToken));

    expect(res.status).toBe(200);
    const estados = res.body.map((r) => r.status);
    expect(estados).toContain("pending");
    expect(estados).toContain("approved");
    expect(estados).toContain("completed");
  });

  it("never leaks join codes to the owner", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(ownerToken));

    for (const fila of res.body) {
      expect(fila.code).toBeUndefined();
    }
  });

  it("a non-owner member still gets 403", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(completedToken));

    expect(res.status).toBe(403);
  });
});