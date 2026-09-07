import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./setup.js";

let ownerAToken, ownerBToken, strangerToken;
let workshopAId, workshopBId;
let machineAId, machineBId;
const sharedSerial = "CROSS-TEST-SERIAL-001";

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

async function createWorkshop(token, name) {
  const res = await request(app)
    .post("/api/workshops")
    .set(...auth(token))
    .send({ name });
  return res.body._id;
}

async function createMachine(token, serial) {
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name: `Machine ${serial} Longer Name`,
      brand: "Brand",
      model: "Model",
      serialNumber: serial,
      status: "active",
    });
  return res;
}

describe("setup: two workshops, each with a machine sharing the same serial", () => {
  it("registers owner A and creates Workshop A", async () => {
    ownerAToken = await registerAndLogin("ownerA@test.com");
    workshopAId = await createWorkshop(ownerAToken, "Workshop A");
    expect(workshopAId).toBeTruthy();
  });

  it("registers owner B and creates Workshop B", async () => {
    ownerBToken = await registerAndLogin("ownerB@test.com");
    workshopBId = await createWorkshop(ownerBToken, "Workshop B");
    expect(workshopBId).toBeTruthy();
  });

  it("registers a stranger with no workshop", async () => {
    strangerToken = await registerAndLogin("stranger@test.com");
  });

  it("owner A creates a machine with serial CROSS-TEST-SERIAL-001", async () => {
    const res = await createMachine(ownerAToken, sharedSerial);
    expect(res.status).toBe(201);
    expect(res.body.serialNumber).toBe(sharedSerial);
    machineAId = res.body._id;
  });

  it("owner B creates a machine with the same serial (different workshop)", async () => {
    const res = await createMachine(ownerBToken, sharedSerial);
    expect(res.status).toBe(201);
    expect(res.body.serialNumber).toBe(sharedSerial);
    machineBId = res.body._id;
  });

  it("same serial in Workshop A is rejected (409)", async () => {
    const res = await createMachine(ownerAToken, sharedSerial);
    expect(res.status).toBe(409);
  });
});

describe("cross-workshop isolation: reads", () => {
  it("owner A can read their own machine", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(machineAId.toString());
  });

  it("owner A cannot read Workshop B's machine (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineBId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(403);
  });

  it("owner B cannot read Workshop A's machine (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}`)
      .set(...auth(ownerBToken));
    expect(res.status).toBe(403);
  });

  it("stranger with no workshop cannot read any machine (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}`)
      .set(...auth(strangerToken));
    expect(res.status).toBe(403);
  });
});

describe("cross-workshop isolation: writes", () => {
  it("owner A cannot update Workshop B's machine (403)", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineBId}`)
      .set(...auth(ownerAToken))
      .send({ name: "Hacked Name That Is Long Enough" });
    expect(res.status).toBe(403);
  });

  it("owner A cannot delete Workshop B's machine (403)", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineBId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(403);
  });

  it("owner A cannot update their own machine without a workshop (stranger)", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineAId}`)
      .set(...auth(strangerToken))
      .send({ name: "Hacked Name That Is Long Enough" });
    expect(res.status).toBe(403);
  });
});

describe("workshop-scoped listing", () => {
  it("owner A sees only Workshop A machines", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(machineAId.toString());
  });

  it("owner B sees only Workshop B machines", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineBId}`)
      .set(...auth(ownerBToken));
    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(machineBId.toString());
  });
});

describe("write enforcement: workshop-less users", () => {
  it("stranger with no workshop cannot create a machine (403)", async () => {
    const res = await createMachine(strangerToken, "NO-WORKSHOP-999");
    expect(res.status).toBe(403);
  });
});
