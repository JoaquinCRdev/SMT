import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import { startOfToday } from "../src/utils/dates.js";

let token, otraToken;
let machineA, machineB;
let planVencido, planPendiente, planVencidoPorEndDate, planHoy, planInactivo;
let recordViejo;

const hoy = startOfToday();
const addDias = (n) => {
  const d = new Date(hoy);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

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

let serialCounter = 1000;
async function createMachine(name, tipo) {
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name,
      brand: "Marca Historial",
      model: "Modelo H",
      tipo,
      serialNumber: `SN-HIS-${serialCounter++}`,
    });
  expect(res.status).toBe(201);
  return res.body;
}

async function createPlan(machineId, payload) {
  const res = await request(app)
    .post(`/api/machine/${machineId}/plans`)
    .set(...auth(token))
    .send(payload);
  expect(res.status).toBe(201);
  return res.body;
}

async function createRecord(machineId, payload) {
  const res = await request(app)
    .post(`/api/machine/${machineId}/records`)
    .set(...auth(token))
    .send(payload);
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  token = await registerAndLogin("historialOwner@test.com");
  otraToken = await registerAndLogin("historialOtro@test.com");

  await request(app)
    .post("/api/workshops")
    .set(...auth(token))
    .send({ name: "Taller Historial" });

  // Máquina A: un vencido por fecha, un pendiente lejano, un pendiente de hoy
  // y un registro viejo.
  machineA = await createMachine("Compresor Alfa Industrial", "maquina");
  planVencido = await createPlan(machineA._id, {
    title: "Lubricacion compresor atrasada",
    frequency: "daily",
    startDate: addDias(-2),
  });
  planPendiente = await createPlan(machineA._id, {
    title: "Revision general del eje",
    description: "revision de eje y rodamientos",
    frequency: "daily",
    startDate: addDias(2),
  });
  planHoy = await createPlan(machineA._id, {
    title: "Plan que vence hoy",
    frequency: "daily",
    startDate: addDias(-1),
  });
  planInactivo = await createPlan(machineA._id, {
    title: "Plan pausado no visible",
    frequency: "daily",
    startDate: addDias(2),
  });
  await request(app)
    .patch(`/api/machine/${machineA._id}/plans/${planInactivo._id}/status`)
    .set(...auth(token))
    .send({ status: "inactive" });

  recordViejo = await createRecord(machineA._id, {
    title: "Cambio de correas del compresor",
    description: "Correas desgastadas",
    performedAt: addDias(-10),
    technician: "Juan Perez",
    duration: 90,
    cost: 250,
  });

  // Máquina B: un vencido por endDate (con nextDue futuro) y un registro de hoy.
  machineB = await createMachine("Torno Beta Industrial", "otro");
  planVencidoPorEndDate = await createPlan(machineB._id, {
    title: "Plan cerrado sin realizar",
    frequency: "daily",
    startDate: addDias(2),
    endDate: addDias(-1),
  });
  await createRecord(machineB._id, {
    title: "Ajuste de fijaciones del torno",
    performedAt: hoy.toISOString().slice(0, 10),
    notes: "Hecho a tiempo",
  });

  // Usuario ajeno: su taller no tiene que filtrar nada a este.
  await request(app)
    .post("/api/workshops")
    .set(...auth(otraToken))
    .send({ name: "Taller Ajeno" });
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(otraToken))
    .send({
      name: "Cizalla Ajena Industrial",
      brand: "Marca Ajena",
      model: "M1",
      tipo: "maquina",
      serialNumber: "SN-AJENA-1",
    });
  expect(res.status).toBe(201);
  await request(app)
    .post(`/api/machine/${res.body._id}/plans`)
    .set(...auth(otraToken))
    .send({ title: "Plan de otro taller", frequency: "daily", startDate: addDias(1) });
});

function byId(items, id) {
  return items.find((i) => i.id === String(id));
}

describe("GET /api/history", () => {
  it("401 sin token", async () => {
    const res = await request(app).get("/api/history");
    expect(res.status).toBe(401);
  });

  it("403 para usuario sin taller", async () => {
    const sinTaller = await registerAndLogin("historialSinTaller@test.com");
    const res = await request(app)
      .get("/api/history")
      .set(...auth(sinTaller));
    expect(res.status).toBe(403);
  });

  it("mezcla registros y planes con el estado correcto", async () => {
    const res = await request(app).get("/api/history").set(...auth(token));
    expect(res.status).toBe(200);

    expect(res.body.counts).toEqual({
      realizado: 2,
      pendiente: 2,
      vencido: 2,
    });
    expect(res.body.meta.total).toBe(6);
    expect(res.body.items.length).toBe(6);

    const items = res.body.items;
    expect(items.every((i) => FECHA_RE.test(i.fecha))).toBe(true);

    expect(byId(items, planVencido._id).estado).toBe("Vencido");
    expect(byId(items, planPendiente._id).estado).toBe("Pendiente");
    expect(byId(items, planHoy._id).estado).toBe("Pendiente");
    expect(byId(items, planVencidoPorEndDate._id).estado).toBe("Vencido");

    const rec = byId(items, recordViejo._id);
    expect(rec.estado).toBe("Realizado");
    expect(rec.source).toBe("record");
    expect(rec.machine.name).toBe("Compresor Alfa Industrial");
    expect(rec.technician).toBe("Juan Perez");
    expect(rec.cost).toBe(250);
    expect(rec.plan).toBeNull();

    const pend = byId(items, planPendiente._id);
    expect(pend.source).toBe("plan");
    expect(pend.plan.frequency).toBe("daily");
    expect(pend.title).toBe("Revision general del eje");
  });

  it("no incluye planes inactivos", async () => {
    const res = await request(app)
      .get("/api/history")
      .set(...auth(token));
    expect(res.body.items.map((i) => i.id)).not.toContain(
      String(planInactivo._id),
    );
  });

  it("filtra por estado sin alterar los counts", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ state: "realizado" })
      .set(...auth(token));
    expect(res.body.items.length).toBe(2);
    expect(res.body.items.every((i) => i.estado === "Realizado")).toBe(true);
    expect(res.body.counts).toEqual({ realizado: 2, pendiente: 2, vencido: 2 });
  });

  it("state=pendiente: queda el plan de hoy y el lejano, ambos Pendiente", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ state: "pendiente" })
      .set(...auth(token));
    expect(res.body.items.length).toBe(2);
    expect(res.body.items.every((i) => i.estado === "Pendiente")).toBe(true);
    expect(byId(res.body.items, planHoy._id).fecha).toBe(
      hoy.toISOString().slice(0, 10),
    );
  });

  it("state=vencido: el vencido por endDate muestra endDate, el otro por nextDue", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ state: "vencido" })
      .set(...auth(token));
    expect(res.body.items.length).toBe(2);
    expect(res.body.items.every((i) => i.estado === "Vencido")).toBe(true);

    const porEndDate = byId(res.body.items, planVencidoPorEndDate._id);
    expect(porEndDate.fecha).toBe(addDias(-1));

    const porNextDue = byId(res.body.items, planVencido._id);
    expect(porNextDue.fecha).toBe(addDias(-1));
  });

  it("days: solo desde hace N días, pero los futuros siempre pasan", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ days: 7 })
      .set(...auth(token));

    // El registro viejo (hace 10 días) queda afuera; el de hoy queda.
    expect(res.body.counts).toEqual({
      realizado: 1,
      pendiente: 2,
      vencido: 2,
    });
    const ids = res.body.items.map((i) => i.id);
    expect(ids).not.toContain(String(recordViejo._id));

    // Un plan con nextDue futuro (dentro de "últ. 7 días") se mantiene.
    expect(ids).toContain(String(planPendiente._id));
  });

  it("search por nombre de máquina", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ search: "Alfa" })
      .set(...auth(token));
    const items = res.body.items;
    expect(items.length).toBe(4);
    expect(items.every((i) => i.machine.name.includes("Alfa"))).toBe(true);
    expect(byId(items, recordViejo._id)).toBeTruthy();
    expect(byId(items, planVencido._id)).toBeTruthy();
  });

  it("search por descripción de un plan", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ search: "eje" })
      .set(...auth(token));
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].id).toBe(String(planPendiente._id));
  });

  it("ordena recientes/antiguos", async () => {
    const { body: recientes } = await request(app)
      .get("/api/history")
      .query({ state: "pendiente", order: "recientes" })
      .set(...auth(token));
    expect(byId(recientes.items, planPendiente._id).fecha).toBe(addDias(3)); // primera en desc

    const { body: antiguos } = await request(app)
      .get("/api/history")
      .query({ state: "pendiente", order: "antiguos" })
      .set(...auth(token));
    expect(byId(antiguos.items, planHoy._id).fecha).toBe(
      hoy.toISOString().slice(0, 10),
    ); // primera en asc
  });

  it("pagina correctamente mezclando registros y planes", async () => {
    const page1 = await request(app)
      .get("/api/history")
      .query({ limit: 2, page: 1 })
      .set(...auth(token));
    expect(page1.body.items.length).toBe(2);
    expect(page1.body.meta.pages).toBe(3);
    expect(page1.body.meta.total).toBe(6);
    // P2 (hoy+3) es lo más nuevo; le sigue el registro de hoy.
    expect(page1.body.items[0].id).toBe(String(planPendiente._id));
    expect(page1.body.items[1].estado).toBe("Realizado");

    const page2 = await request(app)
      .get("/api/history")
      .query({ limit: 2, page: 2 })
      .set(...auth(token));
    expect(page2.body.items.length).toBe(2);

    const page3 = await request(app)
      .get("/api/history")
      .query({ limit: 2, page: 3 })
      .set(...auth(token));
    expect(page3.body.items.length).toBe(2);

    const todos = [...page1.body.items, ...page2.body.items, ...page3.body.items].map(
      (i) => i.id,
    );
    expect(new Set(todos).size).toBe(6);
  });

  it("pagina realizado (paginado en Mongo) en más de una página", async () => {
    const page1 = await request(app)
      .get("/api/history")
      .query({ state: "realizado", limit: 1, page: 1 })
      .set(...auth(token));
    expect(page1.body.items).toHaveLength(1);
    expect(page1.body.meta.total).toBe(2);
    expect(page1.body.meta.pages).toBe(2);

    const page2 = await request(app)
      .get("/api/history")
      .query({ state: "realizado", limit: 1, page: 2 })
      .set(...auth(token));
    expect(page2.body.items).toHaveLength(1);
    const ids = [page1.body.items[0].id, page2.body.items[0].id];
    expect(new Set(ids).size).toBe(2);
  });

  it("filtra por machineId y devuelve su máquina inválida vacía", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ machineId: machineB._id })
      .set(...auth(token));
    expect(res.body.meta.total).toBe(2);
    expect(res.body.items.every((i) => i.machine.name === "Torno Beta Industrial")).toBe(
      true,
    );

    const invalida = await request(app)
      .get("/api/history")
      .query({ machineId: "000000000000000000000000" })
      .set(...auth(token));
    expect(invalida.body.items).toEqual([]);
    expect(invalida.body.meta.total).toBe(0);
    expect(invalida.body.machines.length).toBe(2);
  });

  it("expone machines del taller para las tarjetas", async () => {
    const res = await request(app)
      .get("/api/history")
      .set(...auth(token));
    expect(res.body.machines).toHaveLength(2);
    const alfa = res.body.machines.find((m) => m.name === "Compresor Alfa Industrial");
    expect(alfa.tipo).toBe("maquina");
    expect(alfa.status).toBeDefined();
    expect(alfa.serialNumber).toBeDefined();
  });

  it("aisla los datos por taller", async () => {
    const res = await request(app)
      .get("/api/history")
      .set(...auth(otraToken));
    expect(res.body.meta.total).toBe(1);
    expect(res.body.machines).toHaveLength(1);
    expect(res.body.items[0].title).toBe("Plan de otro taller");
  });
});