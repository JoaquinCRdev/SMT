import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import Notification from "../src/models/notification.model.js";

// GET /api/home es el resumen del taller en un solo viaje: contadores,
// mantenimientos urgentes y avisos recientes. Todo acotado al taller del
// usuario, igual que el resto de los listados.

let token, otraToken;
let machineA, machineB, planVencido, planProximo;
let nombreTaller, tallerId;

function auth(t) {
  return ["Authorization", `Bearer ${t}`];
}

const hoy = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");

function addDias(n) {
  const d = new Date(hoy);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body.accessToken;
}

async function createMachine(t, name, tipo, serial) {
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(t))
    .send({
      name,
      brand: "Marca Home",
      model: "Modelo H",
      tipo,
      serialNumber: serial,
    });
  expect(res.status).toBe(201);
  return res.body;
}

// El servicio calcula nextDue = startDate + frequency, así que la fecha se
// controla desde startDate (daily = +1 día).
async function createPlan(t, machineId, payload) {
  const res = await request(app)
    .post(`/api/machine/${machineId}/plans`)
    .set(...auth(t))
    .send({ frequency: "daily", ...payload });
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  token = await registerAndLogin("homeOwner@test.com");
  otraToken = await registerAndLogin("homeOtro@test.com");

  nombreTaller = "Taller Home";
  const ws = await request(app)
    .post("/api/workshops")
    .set(...auth(token))
    .send({ name: nombreTaller });
  tallerId = ws.body._id;

  // Dos máquinas principales y una "otra": los contadores del resumen salen de
  // acá.
  machineA = await createMachine(token, "Compresor Alfa Industrial", "maquina", "SN-HOME-1");
  machineB = await createMachine(token, "Torno Beta Industrial", "maquina", "SN-HOME-2");
  await createMachine(token, "Escritorio Gamma Industrial", "otro", "SN-HOME-3");

  // Un ejecutable: startDate -2 días => nextDue ayer => vencido hace 1 día.
  planVencido = await createPlan(token, machineA._id, {
    title: "Lubricacion compresor atrasada",
    startDate: addDias(-2),
  });

  // Uno dentro de la ventana del diario (nextDue mañana).
  planProximo = await createPlan(token, machineB._id, {
    title: "Revision del torno proxima",
    startDate: addDias(0),
  });

  // Un plan pausado que no debe aparecer ni contar como activo.
  const pausado = await createPlan(token, machineA._id, {
    title: "Plan pausado que no cuenta",
    startDate: addDias(-5),
  });
  const patch = await request(app)
    .patch(`/api/machine/${machineA._id}/plans/${pausado._id}/status`)
    .set(...auth(token))
    .send({ status: "inactive" });
  expect(patch.status).toBe(200);

  // Personal: el dueño + un miembro agregado.
  const miembro = await request(app)
    .post("/api/workshops/mine/members")
    .set(...auth(token))
    .send({
      name: "Miembro Home",
      email: "miembroHome@test.com",
      password: "12345678",
    });
  expect(miembro.status).toBe(201);

  // Avisos: dos de taller (el resumen muestra los 2 más recientes) y uno de otro taller.
  await Notification.create({
    workshop: tallerId,
    type: "sistema",
    title: "Aviso viejo",
    message: "Primero",
  });
  await Notification.create({
    workshop: tallerId,
    type: "sistema",
    title: "Aviso reciente",
    message: "Segundo",
  });

  // Taller ajeno: su máquina, su plan vencido y su aviso no deben filtrarse.
  await request(app)
    .post("/api/workshops")
    .set(...auth(otraToken))
    .send({ name: "Taller Ajeno Home" });
  const ajena = await createMachine(otraToken, "Cizalla Ajena Industrial", "maquina", "SN-HOME-AJENA");
  await createPlan(otraToken, ajena._id, {
    title: "Plan ajeno vencidisimo",
    startDate: addDias(-30),
  });
  await Notification.create({
    workshop: ajena.workshopId,
    type: "sistema",
    title: "Aviso de otro taller",
    message: "No debe verse",
  });
});

describe("GET /api/home", () => {
  it("devuelve resumen, urgentes y notificaciones recientes", async () => {
    const res = await request(app).get("/api/home").set(...auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("resumen");
    expect(res.body).toHaveProperty("mantenimientosUrgentes");
    expect(res.body).toHaveProperty("notificacionesRecientes");
    // El cliente lee exactamente estas cuatro claves del resumen.
    expect(Object.keys(res.body.resumen).sort()).toEqual([
      "mantenimientosActivos",
      "maquinas",
      "otros",
      "personal",
    ]);
  });

  it("cuenta maquinas, otros, mantenimientos activos y personal del taller", async () => {
    const res = await request(app).get("/api/home").set(...auth(token));

    // 2 "maquina" (A y B) y 1 "otro".
    expect(res.body.resumen.maquinas).toBe(2);
    expect(res.body.resumen.otros).toBe(1);
    // Sólo los 2 activos: el pausado no cuenta.
    expect(res.body.resumen.mantenimientosActivos).toBe(2);
    // Dueño + miembro agregado.
    expect(res.body.resumen.personal).toBe(2);
  });

  it("marca vencido y proximo con los días, sin formatear texto", async () => {
    const res = await request(app).get("/api/home").set(...auth(token));

    const vencido = res.body.mantenimientosUrgentes.find(
      (u) => u.id === String(planVencido._id),
    );
    expect(vencido.estado).toBe("vencido");
    expect(vencido.dias).toBe(1); // venció ayer
    expect(vencido.machine.name).toBe("Compresor Alfa Industrial");
    expect(vencido.title).toBe("Lubricacion compresor atrasada");
    expect(vencido.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const proximo = res.body.mantenimientosUrgentes.find(
      (u) => u.id === String(planProximo._id),
    );
    expect(proximo.estado).toBe("proximo");
    expect(proximo.dias).toBe(-1); // vence mañana
  });

  it("ordena los urgentes por los más atrasados primero", async () => {
    const res = await request(app).get("/api/home").set(...auth(token));
    const dias = res.body.mantenimientosUrgentes.map((u) => u.dias);

    expect(dias).toEqual([...dias].sort((a, b) => b - a));
    expect(dias[0]).toBe(1);
  });

  it("excluye los planes pausados", async () => {
    const res = await request(app).get("/api/home").set(...auth(token));
    const titulos = res.body.mantenimientosUrgentes.map((u) => u.title);

    expect(titulos).not.toContain("Plan pausado que no cuenta");
  });

  it("un plan con endDate pasado figura como vencido con esa fecha", async () => {
    const plan = await createPlan(token, machineB._id, {
      title: "Plan cerrado sin realizar",
      startDate: addDias(5),
      endDate: addDias(-1),
    });

    const res = await request(app).get("/api/home").set(...auth(token));
    const urgente = res.body.mantenimientosUrgentes.find(
      (u) => u.id === String(plan._id),
    );

    expect(urgente.estado).toBe("vencido");
    expect(urgente.fecha).toBe(addDias(-1));
  });

  it("sólo devuelve los avisos del taller propio", async () => {
    const res = await request(app).get("/api/home").set(...auth(token));
    const titulos = res.body.notificacionesRecientes.map((n) => n.title);

    expect(titulos).not.toContain("Aviso de otro taller");
    expect(titulos).toContain("Aviso reciente");
  });

  it("trae a lo sumo dos notificaciones, la más reciente primero", async () => {
    const res = await request(app).get("/api/home").set(...auth(token));

    expect(res.body.notificacionesRecientes.length).toBeLessThanOrEqual(2);
    const fechas = res.body.notificacionesRecientes.map((n) =>
      new Date(n.createdAt).getTime(),
    );
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
    // El estado de lectura viene calculado.
    expect(typeof res.body.notificacionesRecientes[0].read).toBe("boolean");
  });

  it("un usuario sin taller recibe 403", async () => {
    const sinTaller = await registerAndLogin("homeSinTaller@test.com");
    const res = await request(app).get("/api/home").set(...auth(sinTaller));

    expect(res.status).toBe(403);
  });

  it("el taller ajeno no ve nada del nuestro", async () => {
    const res = await request(app).get("/api/home").set(...auth(otraToken));

    expect(res.body.resumen.maquinas).toBe(1);
    expect(res.body.resumen.otros).toBe(0);
    expect(res.body.resumen.personal).toBe(1);
    const titulos = res.body.mantenimientosUrgentes.map((u) => u.title);
    expect(titulos).toEqual(["Plan ajeno vencidisimo"]);
    const avisos = res.body.notificacionesRecientes.map((n) => n.title);
    expect(avisos).not.toContain("Aviso reciente");
  });
});
