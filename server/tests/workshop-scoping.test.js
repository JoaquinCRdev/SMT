import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";

let tokenA, tokenB, tokenNoWorkshop;
let machineAId, machineBId;

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

async function createMachine(token, serialNumber) {
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name: "Maquina Scoping De Prueba Test",
      brand: "Brand",
      model: "Model",
      tipo: "maquina",
      serialNumber,
    });
  return res.body;
}

const SHARED_SERIAL = "SHARED-0001";

beforeAll(async () => {
  tokenA = await registerAndLogin("scopingA@test.com");
  await createWorkshop(tokenA, "Scoping Workshop A");
  const machineA = await createMachine(tokenA, SHARED_SERIAL);
  machineAId = machineA._id;

  tokenB = await registerAndLogin("scopingB@test.com");
  await createWorkshop(tokenB, "Scoping Workshop B");
  const machineB = await createMachine(tokenB, SHARED_SERIAL);
  machineBId = machineB._id;

  tokenNoWorkshop = await registerAndLogin("scopingNoWs@test.com");
});

describe("workshop scoping and serial isolation", () => {
  it("create machine without a workshop is forbidden (403)", async () => {
    const res = await request(app)
      .post("/api/machine")
      .set(...auth(tokenNoWorkshop))
      .send({
        name: "Maquina Sin Taller De Prueba",
        brand: "Brand",
        model: "Model",
        tipo: "maquina",
        serialNumber: "NOWHERE-1",
      });
    expect(res.status).toBe(403);
  });

  it("same serialNumber allowed in different workshops (201)", async () => {
    expect(machineAId).toBeTruthy();
    expect(machineBId).toBeTruthy();
  });

  it("duplicate serialNumber within the same workshop is rejected (409)", async () => {
    const res = await request(app)
      .post("/api/machine")
      .set(...auth(tokenA))
      .send({
        name: "Maquina Duplicada De Prueba",
        brand: "Brand",
        model: "Model",
        tipo: "maquina",
        serialNumber: SHARED_SERIAL,
      });
    expect(res.status).toBe(409);
  });

  it("machine list only shows machines of my own workshop", async () => {
    const resA = await request(app).get("/api/machine").set(...auth(tokenA));
    expect(resA.body.items.every((m) => m.workshopId.name === "Scoping Workshop A")).toBe(true);
    expect(resA.body.items.length).toBe(1);

    const resB = await request(app).get("/api/machine").set(...auth(tokenB));
    expect(resB.body.items.every((m) => m.workshopId.name === "Scoping Workshop B")).toBe(true);
  });

  it("cannot read another workshop's machine (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}`)
      .set(...auth(tokenB));
    expect(res.status).toBe(403);
  });

  it("cannot update another workshop's machine (403)", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineAId}`)
      .set(...auth(tokenB))
      .send({ name: "Maquina Hackeada De Prueba" });
    expect(res.status).toBe(403);
  });

  it("cannot delete another workshop's machine (403)", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineAId}`)
      .set(...auth(tokenB));
    expect(res.status).toBe(403);
  });

  it("cannot add a document to another workshop's machine (403)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/documents`)
      .set(...auth(tokenB))
      .send({
        fileName: "Documento Ajeno",
        fileUrl: "https://cdn.example.com/x.pdf",
        storagePath: "scoping/x.pdf",
        fileType: "pdf",
        fileSize: 1024,
      });
    expect(res.status).toBe(403);
  });

  it("cannot list another workshop's machine images (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/images`)
      .set(...auth(tokenB));
    expect(res.status).toBe(403);
  });

  it("cannot create a task in another workshop's machine (403)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/tasks`)
      .set(...auth(tokenB))
      .send({ title: "Tarea Ajena De Prueba" });
    expect(res.status).toBe(403);
  });

  it("cannot fetch tasklogs of another workshop's machine (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/tasklogs`)
      .set(...auth(tokenB));
    expect(res.status).toBe(403);
  });

  it("cannot create a maintenance plan on another workshop's machine (403)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/plans`)
      .set(...auth(tokenB))
      .send({
        title: "Plan Ajeno De Prueba",
        frequency: "monthly",
        startDate: "2026-09-01",
      });
    expect(res.status).toBe(403);
  });

  it("cannot create a maintenance record on another workshop's machine (403)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/records`)
      .set(...auth(tokenB))
      .send({ title: "Registro Ajeno De Prueba", performedAt: "2026-09-01" });
    expect(res.status).toBe(403);
  });

  it("global records list only includes my workshop (200)", async () => {
    const res = await request(app).get("/api/records").set(...auth(tokenA));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("machine list is paginated with meta and q filter", async () => {
    const res = await request(app)
      .get("/api/machine")
      .query({ page: 1, limit: 5, q: "Maquina Scoping" })
      .set(...auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
  });

  it("machine list supports the status filter", async () => {
    const res = await request(app)
      .get("/api/machine")
      .query({ status: "active" })
      .set(...auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });
});