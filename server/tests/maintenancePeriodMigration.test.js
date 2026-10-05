import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import MaintenancePlan from "../src/models/maintenancePlan.model.js";
import Notification from "../src/models/notification.model.js";
import { sweepDueMaintenance } from "../src/jobs/maintenanceDue.job.js";

const auth = (token) => ["Authorization", `Bearer ${token}`];

async function register(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body.accessToken;
}

// Réplica exacta de la lógica del script de migración, para poder testearla sin
// abrir una conexión real contra la base.
const DAYS_BROKEN = 90;
const REPLACEMENT_DAYS = 1;

async function migrar() {
  const planes = await MaintenancePlan.find({
    frequency: "custom",
    customDays: DAYS_BROKEN,
  }).lean();

  for (const plan of planes) {
    const base = plan.startDate ? new Date(plan.startDate) : new Date();
    base.setDate(base.getDate() + REPLACEMENT_DAYS);

    await MaintenancePlan.updateOne(
      { _id: plan._id },
      {
        $set: { frequency: "daily", nextDue: base },
        $unset: { customDays: "" },
      },
    );
  }

  return planes.length;
}

const iso = (d) => new Date(d).toISOString().slice(0, 10);
function daysFromNow(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

describe("migración de planes rotos (customDays: 90)", () => {
  let owner;
  let machineId;
  let roto;
  let sano;

  beforeAll(async () => {
    owner = await register("migOwner@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(owner))
      .send({ name: "Taller Migracion" });

    const machine = await request(app)
      .post("/api/machine")
      .set(...auth(owner))
      .send({
        name: "Maquina de prueba migracion",
        brand: "Marca",
        model: "Modelo",
        tipo: "maquina",
        serialNumber: "MIGR-TEST-0001",
      });
    machineId = machine.body._id;

    const crear = async (title, frequency, startOffset, customDays) => {
      const res = await request(app)
        .post(`/api/machine/${machineId}/plans`)
        .set(...auth(owner))
        .send({
          title,
          frequency,
          customDays,
          startDate: iso(daysFromNow(startOffset)),
          tasks: [{ title: "Revisar nivel de aceite" }],
        });
      expect(res.status).toBe(201);
      return res.body;
    };

    // Así lo guardaba el formulario con el bug.
    roto = await crear("Plan trimestral rotito", "custom", 0, DAYS_BROKEN);
    sano = await crear("Plan diario sano", "daily", 0, undefined);
  });

  it("el fixture quedó como el bug lo dejaba", async () => {
    expect(roto.frequency).toBe("custom");
    expect(roto.customDays).toBe(DAYS_BROKEN);
    expect(sano.frequency).toBe("daily");
    expect(sano.customDays).toBeUndefined();
  });

  it("el plan roto no generaba aviso antes de migrar (90 días adelante)", async () => {
    await sweepDueMaintenance();
    const aviso = await Notification.findOne({
      "meta.planId": String(roto._id),
    }).lean();
    expect(aviso).toBeNull();
  });

  it("migra el plan roto a daily y recalcula nextDue", async () => {
    const count = await migrar();
    expect(count).toBeGreaterThan(0);

    const plan = await MaintenancePlan.findById(roto._id).lean();
    expect(plan.frequency).toBe("daily");
    expect(plan.customDays).toBeUndefined();

    const esperado = daysFromNow(REPLACEMENT_DAYS).getTime();
    const dif = Math.abs(new Date(plan.nextDue).getTime() - esperado);
    expect(dif).toBeLessThanOrEqual(86_400_000);
  });

  it("el plan sano quedó intacto", async () => {
    const plan = await MaintenancePlan.findById(sano._id).lean();
    expect(plan.frequency).toBe("daily");
    expect(plan.customDays).toBeUndefined();
  });

  it("es idempotente: una segunda pasada no toca nada", async () => {
    const antes = await MaintenancePlan.findById(roto._id).lean();
    const count = await migrar();
    expect(count).toBe(0);

    const despues = await MaintenancePlan.findById(roto._id).lean();
    expect(despues.nextDue.getTime()).toBe(antes.nextDue.getTime());
  });

  it("tras migrar, el plan entra en la ventana y avisa", async () => {
    await sweepDueMaintenance();
    const aviso = await Notification.findOne({
      "meta.planId": String(roto._id),
    }).lean();

    expect(aviso).toBeTruthy();
    expect(aviso.workshop).toBeTruthy();
  });
});
describe("cambio de periodicidad en edicion", () => {
  it("pasar de custom a daily borra el customDays viejo", async () => {
    const reg = async (e) => {
      await request(app).post("/api/register").send({ name: e.split("@")[0], email: e, password: "12345678" });
      return (await request(app).post("/api/login").send({ email: e, password: "12345678" })).body.accessToken;
    };
    const owner = await reg("editOwner@test.com");
    await request(app).post("/api/workshops").set(...auth(owner)).send({ name: "Taller Edicion" });
    const m = await request(app).post("/api/machine").set(...auth(owner)).send({
      name: "Maquina edicion", brand: "Marca", model: "Modelo", tipo: "maquina", serialNumber: "EDIT-TEST-0001" });

    const creado = await request(app)
      .post(`/api/machine/${m.body._id}/plans`)
      .set(...auth(owner))
      .send({
        title: "Plan a editar", frequency: "custom", customDays: 45,
        startDate: iso(daysFromNow(0)), tasks: [{ title: "Revisar aceite" }] });
    expect(creado.status).toBe(201);
    expect(creado.body.customDays).toBe(45);

    // El frontend no manda customDays cuando elige una frecuencia nativa.
    const res = await request(app)
      .put(`/api/machine/${m.body._id}/plans/${creado.body._id}`)
      .set(...auth(owner))
      .send({ frequency: "daily" });
    expect(res.status).toBe(200);

    const plan = await MaintenancePlan.findById(creado.body._id).lean();
    expect(plan.frequency).toBe("daily");
    expect(plan.customDays).toBeUndefined();
    expect(plan.nextDue.getTime()).toBeCloseTo(daysFromNow(1).getTime(), -6);
  });

  it("volver a custom sin mandar dias conserva el valor anterior", async () => {
    const reg = async (e) => {
      await request(app).post("/api/register").send({ name: e.split("@")[0], email: e, password: "12345678" });
      return (await request(app).post("/api/login").send({ email: e, password: "12345678" })).body.accessToken;
    };
    const owner = await reg("editOwner2@test.com");
    await request(app).post("/api/workshops").set(...auth(owner)).send({ name: "Taller Edicion 2" });
    const m = await request(app).post("/api/machine").set(...auth(owner)).send({
      name: "Maquina edicion 2", brand: "Marca", model: "Modelo", tipo: "maquina", serialNumber: "EDIT-TEST-0002" });

    const creado = await request(app)
      .post(`/api/machine/${m.body._id}/plans`)
      .set(...auth(owner))
      .send({
        title: "Plan round trip", frequency: "custom", customDays: 60,
        startDate: iso(daysFromNow(0)), tasks: [{ title: "Revisar aceite" }] });

    await request(app)
      .put(`/api/machine/${m.body._id}/plans/${creado.body._id}`)
      .set(...auth(owner))
      .send({ frequency: "daily" });

    await request(app)
      .put(`/api/machine/${m.body._id}/plans/${creado.body._id}`)
      .set(...auth(owner))
      .send({ frequency: "custom", customDays: 60 });

    const plan = await MaintenancePlan.findById(creado.body._id).lean();
    expect(plan.frequency).toBe("custom");
    expect(plan.customDays).toBe(60);
  });
});
