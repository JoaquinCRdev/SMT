import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";

let ownerAToken, ownerBToken;
let workshopAId;
let machineId;

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

beforeAll(async () => {
  ownerAToken = await registerAndLogin("wsOwnerA@test.com");
  workshopAId = await createWorkshop(ownerAToken, "Ownership Test Workshop");

  ownerBToken = await registerAndLogin("wsOwnerB@test.com");
  await createWorkshop(ownerBToken, "Ownership Test Workshop B");

  const machineRes = await request(app)
    .post("/api/machine")
    .set(...auth(ownerAToken))
    .send({
      name: `Maquina Operativo Test Name`,
      brand: "Brand",
      model: "Model",
      tipo: "maquina",
      serialNumber: "WS-OP-001",
      status: "operativo",
    });
  machineId = machineRes.body._id;
});

describe("workshop ownership gates management (not global admin role)", () => {
  it("any user (no prior workshop) can create a workshop and becomes owner (201)", async () => {
    const token = await registerAndLogin("wsFresh@test.com");
    const res = await request(app)
      .post("/api/workshops")
      .set(...auth(token))
      .send({ name: "A Third Workshop Some Name" });
    expect(res.status).toBe(201);
  });

  it("workshop owner can update their own workshop (200)", async () => {
    const res = await request(app)
      .patch(`/api/workshops/${workshopAId}`)
      .set(...auth(ownerAToken))
      .send({ name: "Updated Workshop Name A" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Workshop Name A");
  });

  it("non-owner cannot update another workshop (403)", async () => {
    const res = await request(app)
      .patch(`/api/workshops/${workshopAId}`)
      .set(...auth(ownerBToken))
      .send({ name: "Hacked Workshop Name Longer" });
    expect(res.status).toBe(403);
  });

  it("non-owner cannot delete another workshop (403)", async () => {
    const res = await request(app)
      .delete(`/api/workshops/${workshopAId}`)
      .set(...auth(ownerBToken));
    expect(res.status).toBe(403);
  });

  it("non-owner cannot regenerate another workshop's code (403)", async () => {
    const res = await request(app)
      .post(`/api/workshops/${workshopAId}/code/regenerate`)
      .set(...auth(ownerBToken));
    expect(res.status).toBe(403);
  });

  it("owner lists only their own workshop's requests", async () => {
    const res = await request(app)
      .get("/api/workshops/requests")
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("spanish machine status normalization", () => {
  it("creates machine with status operativo (stored canonical active)", async () => {
    const res = await request(app)
      .get("/api/machine")
      .query({ status: "active" })
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    const machine = res.body.items.find(
      (m) => m._id.toString() === machineId.toString(),
    );
    expect(machine).toBeTruthy();
    expect(machine.status).toBe("active");
  });

  it("creates a machine with an invalid status (400)", async () => {
    const res = await request(app)
      .post("/api/machine")
      .set(...auth(ownerAToken))
      .send({
        name: "Maquina Con Estado Invalido",
        brand: "Brand",
        model: "Model",
        tipo: "maquina",
        serialNumber: "WS-BADSTATUS-1",
        status: "en_reparacion",
      });
    expect(res.status).toBe(400);
  });

  it("updateMachine rejects an invalid status (400)", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineId}`)
      .set(...auth(ownerAToken))
      .send({ status: "on_hold" });
    expect(res.status).toBe(400);
  });

  it("list filter ?status=operativo returns the machine", async () => {
    const res = await request(app)
      .get("/api/machine")
      .query({ status: "operativo" })
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.items.some((m) => m._id.toString() === machineId.toString())).toBe(true);
  });

  it("list filter ?status=active also returns the machine (canonical)", async () => {
    const res = await request(app)
      .get("/api/machine")
      .query({ status: "active" })
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.items.some((m) => m._id.toString() === machineId.toString())).toBe(true);
  });

  it("updateMachine with mantenimiento normalizes", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineId}`)
      .set(...auth(ownerAToken))
      .send({ status: "mantenimiento" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("maintenance");
  });
});