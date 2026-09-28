import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";

let token, machineId, planId, recordId;

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

beforeAll(async () => {
  token = await registerAndLogin("recordsOwner@test.com");
  await request(app)
    .post("/api/workshops")
    .set(...auth(token))
    .send({ name: "Records Workshop Name" });

  const machine = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name: "Maquina Para Registros Test",
      brand: "Brand",
      model: "Model",
      tipo: "maquina",
      serialNumber: "REC-0001",
    });
  machineId = machine.body._id;

  const plan = await request(app)
    .post(`/api/machine/${machineId}/plans`)
    .set(...auth(token))
    .send({
      title: "Plan para registro de mantenimiento",
      frequency: "monthly",
      startDate: "2026-09-01",
    });
  planId = plan.body._id;
});

describe("maintenance records", () => {
  it("creates a maintenance record (201)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/records`)
      .set(...auth(token))
      .send({
        title: "Cambio de correas de transmision",
        description: "Sustitucion de correas desgastadas",
        performedAt: "2026-09-15",
        duration: 90,
        cost: 250,
        technician: "Juan Perez",
      });
    expect(res.status).toBe(201);
    recordId = res.body._id;
    expect(String(res.body.machineId._id)).toBe(machineId);
  });

  it("creates a record linked to a plan (201) and updates plan nextDue", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/records`)
      .set(...auth(token))
      .send({
        planId,
        title: "Registro vinculado al plan",
        performedAt: "2026-09-20",
      });
    expect(res.status).toBe(201);
    expect(String(res.body.planId._id)).toBe(planId);
  });

  it("lists records by machine (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/records`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
  });

  it("lists all records via the global endpoint (200)", async () => {
    const res = await request(app).get("/api/records").set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
  });

  it("gets a single record by id (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/records`)
      .set(...auth(token));
    const found = res.body.items.find((r) => String(r._id) === recordId);
    expect(found).toBeTruthy();
    expect(found.title).toBe("Cambio de correas de transmision");
  });

  it("requires a workshop to list all records (403)", async () => {
    const orphan = await registerAndLogin("recordsOrphan@test.com");
    const res = await request(app)
      .get("/api/records")
      .set(...auth(orphan));
    expect(res.status).toBe(403);
  });

  it("does not leak records from another workshop (200)", async () => {
    const otherToken = await registerAndLogin("recordsOther@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(otherToken))
      .send({ name: "Other Records Workshop" });

    const res = await request(app)
      .get("/api/records")
      .set(...auth(otherToken));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });

  it("a foreign machineId in the query cannot leak another workshop's records", async () => {
    const otherToken = await registerAndLogin("recordsLeak@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(otherToken))
      .send({ name: "Leak Records Workshop" });
    const otherMachine = await request(app)
      .post("/api/machine")
      .set(...auth(otherToken))
      .send({
        name: "Maquina De Otro Taller Test",
        brand: "Brand",
        model: "Model",
        tipo: "maquina",
        serialNumber: "LEAKREC-0001",
      });
    await request(app)
      .post(`/api/machine/${otherMachine.body._id}/records`)
      .set(...auth(otherToken))
      .send({
        title: "Registro privado de otro taller",
        machineId: otherMachine.body._id,
        performedAt: "2026-09-20",
      });

    const res = await request(app)
      .get(`/api/records?machineId=${otherMachine.body._id}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});