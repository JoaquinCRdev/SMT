// Verifica la forma EXACTA que consume el nuevo historial.jsx: que el endpoint
// entregue los campos que el adapter renombra (machine.name, title, description)
// y que las StatCards puedan leer tipo/status de machines.
import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";

let token, maquinaId;
const auth = () => ["Authorization", `Bearer ${token}`];

async function registerAndLogin(email) {
  await request(app).post("/api/register").send({
    name: email.split("@")[0], email, password: "12345678",
  });
  const res = await request(app).post("/api/login").send({ email, password: "12345678" });
  return res.body.accessToken;
}

beforeAll(async () => {
  token = await registerAndLogin("histShape@test.com");
  await request(app).post("/api/workshops").set(...auth()).send({ name: "Taller Shape" });

  const mac = await request(app).post("/api/machine").set(...auth()).send({
    name: "Compresor Shape", brand: "ACME", model: "X1", tipo: "maquina", serialNumber: "SN-SHAPE-1",
  });
  expect(mac.status).toBe(201);
  maquinaId = mac.body._id;

  await request(app).post(`/api/machine/${maquinaId}/records`).set(...auth()).send({
    title: "Cambio de aceite", description: "Filtros y presiones",
    performedAt: new Date().toISOString(),
  });
  await request(app).post(`/api/machine/${maquinaId}/plans`).set(...auth()).send({
    title: "Calibracion", description: "Eje Z", frequency: "monthly",
    nextDue: new Date(Date.now() + 5 * 86400000).toISOString(),
  });
});

describe("contrato de /api/history para el frontend", () => {
  it("items/counts/meta/machines con los campos que adapta el cliente", async () => {
    const res = await request(app).get("/api/history").query({
      state: "todos", days: "30", search: "", order: "recientes", page: 1, limit: 20,
    }).set(...auth());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.counts).toEqual({
      realizado: expect.any(Number), pendiente: expect.any(Number), vencido: expect.any(Number),
    });
    expect(res.body.meta).toMatchObject({ total: expect.any(Number), page: 1, limit: 20, pages: expect.any(Number) });

    const item = res.body.items[0];
    expect(item).toHaveProperty("title");
    expect(item).toHaveProperty("description");
    expect(item.machine).toHaveProperty("name");
    expect(item.machine).toHaveProperty("tipo");
    expect(item.machine).toHaveProperty("status");
    expect(["Realizado", "Pendiente", "Vencido"]).toContain(item.estado);
    expect(item.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("machines trae tipo y status para las StatCards", async () => {
    const res = await request(app).get("/api/history").set(...auth());
    expect(res.body.machines.length).toBeGreaterThan(0);
    for (const m of res.body.machines) {
      expect(["maquina", "otro"]).toContain(m.tipo);
      expect(["active", "inactive", "maintenance"]).toContain(m.status);
      expect(m).toHaveProperty("name");
    }
  });

  it("los slugs de estado del <select> los acepta el backend", async () => {
    for (const slug of ["realizado", "pendiente", "vencido"]) {
      const res = await request(app).get("/api/history").query({ state: slug }).set(...auth());
      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.estado.toLowerCase().startsWith(slug.slice(0, 4))).toBe(true);
      }
    }
  });
});
