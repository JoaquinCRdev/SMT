import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import MaintenancePlan from "../src/models/maintenancePlan.model.js";
import Notification from "../src/models/notification.model.js";
import { sweepDueMaintenance } from "../src/jobs/maintenanceDue.job.js";

let owner, member, outsider, workshopCode;

function auth(t) {
  return ["Authorization", `Bearer ${t}`];
}

async function register(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body.accessToken;
}

// El validador de máquina pide name >= 15 caracteres, por eso los nombres
// de prueba son largos.
async function createMachine(token, serial, name) {
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name,
      brand: "Marca",
      model: "Modelo",
      tipo: "maquina",
      serialNumber: serial,
    });
  expect(res.status).toBe(201);
  return res.body._id;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// `nextDue` no se puede pasar por API: el servicio siempre lo calcula como
// startDate + frequency. Por eso los tests manejan la fecha vía startDate.
async function createPlan(token, machineId, { startDate, frequency = "daily" }) {
  const res = await request(app)
    .post(`/api/machine/${machineId}/plans`)
    .set(...auth(token))
    .send({
      title: "Mantenimiento mensual de prueba",
      frequency,
      startDate: startDate.toISOString().slice(0, 10),
      tasks: [{ title: "Revisar nivel de aceite" }],
    });
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  owner = await register("notiOwner@test.com");
  const created = await request(app)
    .post("/api/workshops")
    .set(...auth(owner))
    .send({ name: "Taller de Notificaciones" });
  workshopCode = created.body.code;

  // Dueño y miembro verían los avisos de taller; outsider no.
  member = await register("notiMember@test.com");
  const join = await request(app)
    .post("/api/workshops/join")
    .set(...auth(member))
    .send({ code: workshopCode });
  const approve = await request(app)
    .patch(`/api/workshops/requests/${join.body._id}`)
    .set(...auth(owner))
    .send({ status: "approved" });
  await request(app)
    .post("/api/workshops/verify-code")
    .set(...auth(member))
    .send({ code: approve.body.code });

  outsider = await register("notiOutsider@test.com");
  await request(app)
    .post("/api/workshops")
    .set(...auth(outsider))
    .send({ name: "Taller Ajeno" });
});

describe("join request notifications", () => {
  it("the owner is notified when someone requests to join", async () => {
    const pending = await register("notiPending@test.com");
    await request(app)
      .post("/api/workshops/join")
      .set(...auth(pending))
      .send({ code: workshopCode });

    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(owner));

    expect(res.status).toBe(200);
    const aviso = res.body.items.find((n) => n.title === "Nueva solicitud de ingreso");
    expect(aviso).toBeTruthy();
    expect(aviso.type).toBe("taller");
    expect(aviso.message).toContain("notiPending");
  });

  it("that notice is directed only at the owner", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(member));

    expect(res.body.items.some((n) => n.title === "Nueva solicitud de ingreso")).toBe(false);
  });

  it("the requester is notified on approval", async () => {
    const pending = await register("notiApproved@test.com");
    const join = await request(app)
      .post("/api/workshops/join")
      .set(...auth(pending))
      .send({ code: workshopCode });
    await request(app)
      .patch(`/api/workshops/requests/${join.body._id}`)
      .set(...auth(owner))
      .send({ status: "approved" });

    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(pending));

    const aviso = res.body.items.find((n) => n.title === "Solicitud aprobada");
    expect(aviso).toBeTruthy();
    expect(aviso.message).toContain("aprobada");
  });

  it("the requester is notified on rejection", async () => {
    const pending = await register("notiRejected@test.com");
    const join = await request(app)
      .post("/api/workshops/join")
      .set(...auth(pending))
      .send({ code: workshopCode });
    await request(app)
      .patch(`/api/workshops/requests/${join.body._id}`)
      .set(...auth(owner))
      .send({ status: "rejected" });

    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(pending));

    const aviso = res.body.items.find((n) => n.title === "Solicitud rechazada");
    expect(aviso).toBeTruthy();
  });
});

describe("maintenance due cron sweep", () => {
  // startDate de hoy + frecuencia diaria => nextDue = mañana.
  it("creates a workshop-wide notice for a plan due tomorrow", async () => {
    const machineId = await createMachine(owner, "NOTI-0001", "Máquina que genera aviso");
    const plan = await createPlan(owner, machineId, { startDate: new Date() });

    const result = await sweepDueMaintenance();
    expect(result.created).toBeGreaterThan(0);

    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(member));

    const aviso = res.body.items.find((n) => n._id === plan._id || n.type === "mantenimiento");
    expect(aviso).toBeTruthy();
    expect(aviso.type).toBe("mantenimiento");
    expect(aviso.message).toContain("Máquina que genera aviso");
    expect(aviso.message).toContain("para mañana");
  });

  it("running the sweep twice does not duplicate anything", async () => {
    const antes = await Notification.countDocuments();
    const result = await sweepDueMaintenance();
    const despues = await Notification.countDocuments();

    expect(result.created).toBe(0);
    expect(despues).toBe(antes);
  });

  it("a re-run does not wipe read state", async () => {
    const memberId = (
      await request(app).get("/api/profile").set(...auth(member))
    ).body._id;

    const res = await request(app)
      .get("/api/notifications?type=mantenimiento")
      .set(...auth(member));
    const objetivo = res.body.items[0];
    expect(objetivo).toBeTruthy();

    await request(app)
      .patch(`/api/notifications/${objetivo._id}/read`)
      .set(...auth(member));

    await sweepDueMaintenance();

    const reload = await Notification.findById(objetivo._id);
    expect(String(reload.readBy[0])).toBe(memberId);
  });

  it("a plan due in a month is not announced yet", async () => {
    const machineId = await createMachine(owner, "NOTI-0002", "Máquina de vencimiento lejano");
    const plan = await createPlan(owner, machineId, {
      startDate: new Date(),
      frequency: "monthly",
    });

    await sweepDueMaintenance();

    const aviso = await Notification.findOne({
      dedupeKey: new RegExp(`due:${plan._id}:`),
    });
    expect(aviso).toBeNull();
  });

  it("a paused plan is not announced", async () => {
    const machineId = await createMachine(owner, "NOTI-0003", "Máquina con plan pausado");
    const plan = await createPlan(owner, machineId, { startDate: new Date() });
    await MaintenancePlan.updateOne(
      { _id: plan._id },
      { $set: { status: "inactive" } },
    );

    await sweepDueMaintenance();

    const aviso = await Notification.findOne({
      dedupeKey: new RegExp(`due:${plan._id}:`),
    });
    expect(aviso).toBeNull();
  });

  it("a plan due today is announced as 'para hoy'", async () => {
    const machineId = await createMachine(owner, "NOTI-0005", "Máquina que vence hoy");
    await createPlan(owner, machineId, { startDate: daysAgo(1) });

    await sweepDueMaintenance();

    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(member));
    const aviso = res.body.items.find((n) => n.message.includes("Máquina que vence hoy"));

    expect(aviso).toBeTruthy();
    expect(aviso.message).toContain("para hoy");
  });

  it("an overdue plan from the past is announced as overdue", async () => {
    const machineId = await createMachine(owner, "NOTI-0004", "Máquina que ya venció");
    const plan = await createPlan(owner, machineId, { startDate: daysAgo(5) });

    await sweepDueMaintenance();

    const aviso = await Notification.findOne({
      dedupeKey: new RegExp(`due:${plan._id}:`),
    });
    // Antes esto se descartaba en silencio para siempre: con `$gte: startOfToday()`
    // el plan vencido caía fuera de la consulta para siempre, así que si el server
    // estaba caído el día del vencimiento el aviso se perdía sin remedio.
    expect(aviso).toBeTruthy();
    expect(aviso.message).toContain("hace");
  });

  it("another workshop sees none of these notices", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(outsider));

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });
});

describe("reading and marking", () => {
  async function firstNotice(token) {
    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(token));
    return res.body.items[0];
  }

  it("unread-count counts notices the user has not opened", async () => {
    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set(...auth(member));
    expect(res.status).toBe(200);
    expect(res.body.unread).toBeGreaterThan(0);
  });

  it("a notice can be marked read and unread again", async () => {
    const notice = await firstNotice(member);
    expect(notice.readBy).toHaveLength(0);

    const read = await request(app)
      .patch(`/api/notifications/${notice._id}/read`)
      .set(...auth(member));
    expect(read.status).toBe(200);
    expect(read.body.readBy).toHaveLength(1);

    const unread = await request(app)
      .patch(`/api/notifications/${notice._id}/unread`)
      .set(...auth(member));
    expect(unread.status).toBe(200);
    expect(unread.body.readBy).toHaveLength(0);
  });

  it("read state is per user, not global", async () => {
    const ownerId = (
      await request(app).get("/api/profile").set(...auth(owner))
    ).body._id;

    const notice = await firstNotice(member);
    await request(app)
      .patch(`/api/notifications/${notice._id}/read`)
      .set(...auth(member));

    // El dueño ve el mismo aviso, pero el "leído" es del miembro, no suyo.
    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(owner));

    const misma = res.body.items.find((n) => n._id === notice._id);
    expect(misma).toBeTruthy();
    expect(misma.readBy.map(String)).not.toContain(ownerId);
  });

  it("filter=unread only returns what is still unread", async () => {
    const all = await request(app).get("/api/notifications").set(...auth(member));
    const objetivo = all.body.items[0];

    await request(app)
      .patch(`/api/notifications/${objetivo._id}/read`)
      .set(...auth(member));

    const res = await request(app)
      .get("/api/notifications?filter=unread")
      .set(...auth(member));

    expect(res.status).toBe(200);
    expect(res.body.items.some((n) => n._id === objetivo._id)).toBe(false);
  });

  it("read-all clears the unread counter for that user only", async () => {
    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set(...auth(member));
    expect(res.status).toBe(200);
    expect(res.body.updated).toBeGreaterThan(0);

    const count = await request(app)
      .get("/api/notifications/unread-count")
      .set(...auth(member));
    expect(count.body.unread).toBe(0);

    const ownerCount = await request(app)
      .get("/api/notifications/unread-count")
      .set(...auth(owner));
    expect(ownerCount.body.unread).toBeGreaterThan(0);
  });

  it("rejects an unknown type (400)", async () => {
    const res = await request(app)
      .get("/api/notifications?type=inventado")
      .set(...auth(member));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown filter (400)", async () => {
    const res = await request(app)
      .get("/api/notifications?filter=inventado")
      .set(...auth(member));
    expect(res.status).toBe(400);
  });

  it("a user cannot read or mark another workshop's notice (403)", async () => {
    const notice = await firstNotice(owner);

    const list = await request(app)
      .get("/api/notifications")
      .set(...auth(outsider));
    expect(list.body.items.some((n) => n._id === notice._id)).toBe(false);

    const mark = await request(app)
      .patch(`/api/notifications/${notice._id}/read`)
      .set(...auth(outsider));
    expect(mark.status).toBe(403);
  });

  it("a targeted notice is not readable by a workshop mate", async () => {
    const pendiente = await register("notiTargeted@test.com");
    const join = await request(app)
      .post("/api/workshops/join")
      .set(...auth(pendiente))
      .send({ code: workshopCode });
    await request(app)
      .patch(`/api/workshops/requests/${join.body._id}`)
      .set(...auth(owner))
      .send({ status: "approved" });

    const own = await request(app).get("/api/notifications").set(...auth(pendiente));
    const aviso = own.body.items.find((n) => n.title === "Solicitud aprobada");

    const mark = await request(app)
      .patch(`/api/notifications/${aviso._id}/read`)
      .set(...auth(member));
    expect(mark.status).toBe(403);
  });

  it("each item carries a `read` flag resolved for the current user", async () => {
    // Usuario nuevo para que el estado de lectura no dependa del orden.
    const pendiente = await register("notiReadFlagPending@test.com");
    const join = await request(app)
      .post("/api/workshops/join")
      .set(...auth(pendiente))
      .send({ code: workshopCode });
    await request(app)
      .patch(`/api/workshops/requests/${join.body._id}`)
      .set(...auth(owner))
      .send({ status: "approved" });

    const res = await request(app)
      .get("/api/notifications")
      .set(...auth(pendiente));

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    // Nadie lo había leído todavía: `read` tiene que venir en false.
    expect(res.body.items.every((n) => n.read === false)).toBe(true);

    const objetivo = res.body.items[0];
    const mark = await request(app)
      .patch(`/api/notifications/${objetivo._id}/read`)
      .set(...auth(pendiente));
    expect(mark.status).toBe(200);

    const reload = await request(app)
      .get("/api/notifications")
      .set(...auth(pendiente));
    const mismo = reload.body.items.find((n) => n._id === objetivo._id);
    expect(mismo.read).toBe(true);

    // Y al volver atrás, vuelve a false.
    await request(app)
      .patch(`/api/notifications/${objetivo._id}/unread`)
      .set(...auth(pendiente));
    const final = await request(app)
      .get("/api/notifications")
      .set(...auth(pendiente));
    expect(final.body.items.find((n) => n._id === objetivo._id).read).toBe(false);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("a malformed id is a 400, not a crash", async () => {
    const res = await request(app)
      .patch("/api/notifications/no-es-un-id/read")
      .set(...auth(member));
    expect(res.status).toBe(400);
  });
});
