import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./setup.js";

let ownerToken, memberToken, member2Token, strangerToken;
let workshopId, code, requestId, ownerId, memberId, member2ReqId;

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body.accessToken;
}

function auth(token) {
  return ["Authorization", `Bearer ${token}`];
}

describe("setup users", () => {
  it("registers and logs in owner, member, second member and stranger", async () => {
    ownerToken = await registerAndLogin("owner@test.com");
    memberToken = await registerAndLogin("member@test.com");
    member2Token = await registerAndLogin("member2@test.com");
    strangerToken = await registerAndLogin("stranger@test.com");
    expect(ownerToken).toBeTruthy();
  });
});

describe("POST /api/workshops", () => {
  it("creates a workshop and makes creator the member", async () => {
    const res = await request(app)
      .post("/api/workshops")
      .set(...auth(ownerToken))
      .send({ name: "Taller Central" });
    expect(res.status).toBe(201);
    expect(res.body.code).toMatch(/^[A-F0-9]{8}$/);
    workshopId = res.body._id;
    code = res.body.code;
  });

  it("rejects a second workshop for the same user", async () => {
    const res = await request(app)
      .post("/api/workshops")
      .set(...auth(ownerToken))
      .send({ name: "Otro Taller" });
    expect(res.status).toBe(409);
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).post("/api/workshops").send({ name: "X" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/workshops/mine", () => {
  it("returns the owner's workshop", async () => {
    const res = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(workshopId.toString());
    ownerId = res.body.owner._id;
  });

  it("returns 404 for a user with no workshop", async () => {
    const res = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(strangerToken));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/workshops/:id", () => {
  it("lets the owner update the workshop", async () => {
    const res = await request(app)
      .patch(`/api/workshops/${workshopId}`)
      .set(...auth(ownerToken))
      .send({ name: "Taller Central Renovado" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Taller Central Renovado");
  });

  it("rejects a non-member stranger", async () => {
    const res = await request(app)
      .patch(`/api/workshops/${workshopId}`)
      .set(...auth(strangerToken))
      .send({ name: "Hackeado" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/workshops/join", () => {
  it("lets a user request to join with a valid code", async () => {
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberToken))
      .send({ code });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    memberId = res.body.user;
  });

  it("rejects an invalid code", async () => {
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(member2Token))
      .send({ code: "00000000" });
    expect(res.status).toBe(404);
  });

  it("rejects a duplicate pending request", async () => {
    const res = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberToken))
      .send({ code });
    expect(res.status).toBe(409);
  });
});

describe("GET /api/workshops/requests", () => {
  it("lets the owner list pending requests", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe("pending");
    expect(res.body[0].user.email).toBe("member@test.com");
    requestId = res.body[0]._id;
  });

  it("returns 404 for a stranger with no workshop", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(strangerToken));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/workshops/requests/:id", () => {
  it("approves the membership request", async () => {
    const res = await request(app)
      .patch(`/api/workshops/requests/${requestId}`)
      .set(...auth(ownerToken))
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  it("rejects resolving an already-resolved request", async () => {
    const res = await request(app)
      .patch(`/api/workshops/requests/${requestId}`)
      .set(...auth(ownerToken))
      .send({ status: "rejected" });
    expect(res.status).toBe(400);
  });

  it("makes the approved user a member (mine now returns the workshop)", async () => {
    const res = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(memberToken));
    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(workshopId.toString());
  });

  it("rejects approval by a non-owner", async () => {
    const res = await request(app)
      .patch(`/api/workshops/requests/${requestId}`)
      .set(...auth(strangerToken))
      .send({ status: "approved" });
    expect(res.status).toBe(403);
  });
});

describe("member management", () => {
  it("lets the owner remove an existing member", async () => {
    const res = await request(app)
      .delete(`/api/workshops/${workshopId}/members/${memberId}`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it("clears membership after removal (mine returns 404)", async () => {
    const res = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(memberToken));
    expect(res.status).toBe(404);
  });

  it("rejects removing the owner", async () => {
    const res = await request(app)
      .delete(`/api/workshops/${workshopId}/members/${ownerId}`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(400);
  });
});

describe("rejoin after removal", () => {
  it("lets a removed user rejoin and be approved again", async () => {
    const joinRes = await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberToken))
      .send({ code });
    expect(joinRes.status).toBe(201);
    const newRequestId = joinRes.body._id;

    const approveRes = await request(app)
      .patch(`/api/workshops/requests/${newRequestId}`)
      .set(...auth(ownerToken))
      .send({ status: "approved" });
    expect(approveRes.status).toBe(200);
  });
});

describe("leaving a workshop", () => {
  it("blocks the owner from leaving", async () => {
    const res = await request(app)
      .post("/api/workshops/leave")
      .set(...auth(ownerToken));
    expect(res.status).toBe(400);
  });

  it("lets a member leave", async () => {
    const res = await request(app)
      .post("/api/workshops/leave")
      .set(...auth(memberToken));
    expect(res.status).toBe(200);
  });

  it("confirms membership cleared after leaving", async () => {
    const res = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(memberToken));
    expect(res.status).toBe(404);
  });
});

describe("join request rejection", () => {
  it("lets a request be rejected and the user reapply", async () => {
    const joinRes = await request(app)
      .post("/api/workshops/join")
      .set(...auth(member2Token))
      .send({ code });
    expect(joinRes.status).toBe(201);
    const reqId = joinRes.body._id;

    const rejectRes = await request(app)
      .patch(`/api/workshops/requests/${reqId}`)
      .set(...auth(ownerToken))
      .send({ status: "rejected" });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe("rejected");

    const reapplyRes = await request(app)
      .post("/api/workshops/join")
      .set(...auth(member2Token))
      .send({ code });
    expect(reapplyRes.status).toBe(201);
    member2ReqId = reapplyRes.body._id;
  });
});

describe("regenerating the code", () => {
  it("changes the invite code", async () => {
    const res = await request(app)
      .post(`/api/workshops/${workshopId}/code/regenerate`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.code).toMatch(/^[A-F0-9]{8}$/);
    expect(res.body.code).not.toBe(code);
    code = res.body.code;
  });

  it("rejects code regeneration by a non-owner", async () => {
    const res = await request(app)
      .post(`/api/workshops/${workshopId}/code/regenerate`)
      .set(...auth(strangerToken));
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/workshops/:id", () => {
  it("detaches members when the owner deletes the workshop", async () => {
    const approveRes = await request(app)
      .patch(`/api/workshops/requests/${member2ReqId}`)
      .set(...auth(ownerToken))
      .send({ status: "approved" });
    expect(approveRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/workshops/${workshopId}`)
      .set(...auth(ownerToken));
    expect(deleteRes.status).toBe(200);

    const memberMine = await request(app)
      .get("/api/workshops/mine")
      .set(...auth(member2Token));
    expect(memberMine.status).toBe(404);
  });
});
