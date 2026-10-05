import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./setup.js";
import { sweepDueMaintenance } from "../src/jobs/maintenanceDue.job.js";
import MaintenancePlan from "../src/models/maintenancePlan.model.js";
import Notification from "../src/models/notification.model.js";

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

const iso = (d) => new Date(d).toISOString().slice(0, 10);

function daysFromNow(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function crear(owner, machineId, data) {
  const res = await request(app)
    .post(`/api/machine/${machineId}/plans`)
    .set(...auth(owner))
    .send({ tasks: [{ title: "Revisar nivel de aceite" }], ...data });

  expect(res.status).toBe(201);
  return res.body;
}

describe("sweep: planes vencidos (la corrida llega tarde)", () => {
  let owner;
  let machineId;

  const nuevoDue = async (nextDue, extra = {}) => {
    const plan = await crear(owner, machineId, {
      title: `Plan vencida ${Math.random().toString(36).slice(2, 8)}`,
      frequency: "daily",
      startDate: iso(daysFromNow(-5)),
    });
    await MaintenancePlan.findByIdAndUpdate(plan._id, { nextDue, ...extra });
    return MaintenancePlan.findById(plan._id).lean();
  };

  it("prepara taller y maquina", async () => {
    owner = await register("sweepOwner@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(owner))
      .send({ name: "Taller Sweep Test" });

    const machine = await request(app)
      .post("/api/machine")
      .set(...auth(owner))
      .send({
        name: "Maquina de prueba para sweep",
        brand: "Marca",
        model: "Modelo",
        tipo: "maquina",
        serialNumber: "SWEEP-TEST-0001",
      });

    machineId = machine.body._id;
    expect(machineId).toBeTruthy();
  });

  it("avisa un plan vencido ayer (antes nunca avisaba)", async () => {
    const plan = await nuevoDue(daysFromNow(-1));
    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeTruthy();
    expect(aviso.message).toContain("venció ayer");
    expect(aviso.type).toBe("mantenimiento");
  });

  it("avisa un plan vencido hace 60 días, sin cota inferior", async () => {
    const plan = await nuevoDue(daysFromNow(-60));
    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeTruthy();
    expect(aviso.message).toMatch(/venció|hace/);
  });

  it("no duplica el aviso de un plan ya vencido", async () => {
    const plan = await nuevoDue(daysFromNow(-3));
    await sweepDueMaintenance();
    const primero = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();

    const { created } = await sweepDueMaintenance();
    const segundo = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();

    expect(String(segundo._id)).toBe(String(primero._id));
  });

  it("no avisa planes pausados (inactive)", async () => {
    const plan = await nuevoDue(daysFromNow(-2), { status: "inactive" });
    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeNull();
  });

  it("ignora planes cuya endDate ya paso", async () => {
    const plan = await nuevoDue(daysFromNow(-4), { endDate: daysFromNow(-1) });
    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeNull();
  });

  it("sigue avisando un plan vencido con endDate futura", async () => {
    const plan = await nuevoDue(daysFromNow(-4), { endDate: daysFromNow(10) });
    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeTruthy();
  });
});

describe("sweep: frecuencias que los tests no cubrian", () => {
  let owner;
  let machineId;

  it("prepara taller y maquina", async () => {
    owner = await register("sweepFreqOwner@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(owner))
      .send({ name: "Taller Sweep Frecuencias" });

    const machine = await request(app)
      .post("/api/machine")
      .set(...auth(owner))
      .send({
        name: "Maquina de prueba frecuencias",
        brand: "Marca",
        model: "Modelo",
        tipo: "maquina",
        serialNumber: "SWEEPFREQ-0001",
      });

    machineId = machine.body._id;
  });

  // El helper de notifications.test.js fijaba frequency: "daily", así que
  // weekly/monthly/yearly/custom nunca seCorrieron contra el sweep.
  // `startOffset` se calcula para que la próxima vencimiento caiga justo
  // dentro de la ventana de esa frecuencia (daily 1, weekly 2, monthly 5,
  // yearly 7, custom 3 por defecto).
  const casos = [
    { frequency: "weekly", startOffset: -5, label: "semanal" },
    { frequency: "monthly", startOffset: -25, label: "mensual" },
    { frequency: "custom", startOffset: -2, customDays: 5, label: "custom" },
    { frequency: "yearly", startOffset: -358, label: "anual" },
  ];

  for (const caso of casos) {
    it(`avisa un plan ${caso.label} cuando entra en la ventana`, async () => {
      const plan = await crear(owner, machineId, {
        title: `Plan ${caso.label} en ventana`,
        frequency: caso.frequency,
        customDays: caso.customDays,
        startDate: iso(daysFromNow(caso.startOffset)),
      });

      await sweepDueMaintenance();

      const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
      expect(aviso, `sin aviso para ${caso.frequency}`).toBeTruthy();
      expect(aviso.workshop).toBeTruthy();
    });
  }

  it("un plan diario a 3 días no avisa (su ventana es de 1)", async () => {
    const plan = await crear(owner, machineId, {
      title: "Plan diario todavia lejos",
      frequency: "daily",
      startDate: iso(daysFromNow(-3)),
    });
    await MaintenancePlan.findByIdAndUpdate(plan._id, {
      nextDue: daysFromNow(3),
    });

    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeNull();
  });

  it("un plan anual a 6 días sí avisa (su ventana es de 7)", async () => {
    const plan = await crear(owner, machineId, {
      title: "Plan anual con margen",
      frequency: "yearly",
      startDate: iso(daysFromNow(0)),
    });
    await MaintenancePlan.findByIdAndUpdate(plan._id, {
      nextDue: daysFromNow(6),
    });

    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeTruthy();
    expect(aviso.message).toContain("en 6 días");
  });

  it("no avisa un plan cuya proxima vencimiento es lejana", async () => {
    const plan = await crear(owner, machineId, {
      title: "Plan semanal lejano",
      frequency: "weekly",
      startDate: iso(daysFromNow(0)),
    });

    await sweepDueMaintenance();

    const aviso = await Notification.findOne({ "meta.planId": String(plan._id) }).lean();
    expect(aviso).toBeNull();
  });

  // Rejilla de ventanas: daily 1, weekly 2, monthly 5, yearly 7, custom 3.
  // Cada frecuencia tiene que avisar HASTA su límiteinclusive, y no un día más.
  // Se prueban todas contra la misma distancia porque si el filtro usara una
  // ventana global, todas entrarían o ninguna.
  const rejilla = [
    { frequency: "daily", customDays: undefined, ventana: 1 },
    { frequency: "weekly", customDays: undefined, ventana: 2 },
    { frequency: "custom", customDays: 5, ventana: 3 },
    { frequency: "monthly", customDays: undefined, ventana: 5 },
    { frequency: "yearly", customDays: undefined, ventana: 7 },
  ];

  for (const caso of rejilla) {
    it(`${caso.frequency} avisa hasta ${caso.ventana} días inclusive`, async () => {
      const etiqueta = `${caso.frequency}${caso.customDays ? `:${caso.customDays}` : ""}`;

      const dentro = await crear(owner, machineId, {
        title: `${etiqueta} borde dentro`,
        frequency: caso.frequency,
        customDays: caso.customDays,
        startDate: iso(daysFromNow(0)),
      });
      await MaintenancePlan.findByIdAndUpdate(dentro._id, {
        nextDue: daysFromNow(caso.ventana),
      });

      const fuera = await crear(owner, machineId, {
        title: `${etiqueta} borde fuera`,
        frequency: caso.frequency,
        customDays: caso.customDays,
        startDate: iso(daysFromNow(0)),
      });
      await MaintenancePlan.findByIdAndUpdate(fuera._id, {
        nextDue: daysFromNow(caso.ventana + 1),
      });

      await sweepDueMaintenance();

      const avisoDentro = await Notification.findOne({
        "meta.planId": String(dentro._id),
      }).lean();
      const avisoFuera = await Notification.findOne({
        "meta.planId": String(fuera._id),
      }).lean();

      expect(
        avisoDentro,
        `${etiqueta} a ${caso.ventana} días debería avisar`,
      ).toBeTruthy();
      expect(
        avisoFuera,
        `${etiqueta} a ${caso.ventana + 1} días no debería avisar`,
      ).toBeNull();
    });
  }

  it("todos los vencidos avisan, sin importar la frecuencia", async () => {
    const ids = [];
    for (const caso of rejilla) {
      const plan = await crear(owner, machineId, {
        title: `${caso.frequency} muy vencido`,
        frequency: caso.frequency,
        customDays: caso.customDays,
        startDate: iso(daysFromNow(-400)),
      });
      await MaintenancePlan.findByIdAndUpdate(plan._id, {
        nextDue: daysFromNow(-10),
      });
      ids.push(plan._id);
    }

    const { created } = await sweepDueMaintenance();

    for (const id of ids) {
      const aviso = await Notification.findOne({
        "meta.planId": String(id),
      }).lean();
      expect(aviso, `plan vencido ${id} sin aviso`).toBeTruthy();
      // Vencido reciente: "hace N días". Pasado el mes cambia a "venció el <fecha>".
      expect(aviso.message).toMatch(/hace 10 días|venció el/);
      // Y nunca debe sonar como un aviso de algo futuro.
      expect(aviso.message).not.toContain("está programado");
    }

    expect(created).toBeGreaterThanOrEqual(ids.length);
  });
});