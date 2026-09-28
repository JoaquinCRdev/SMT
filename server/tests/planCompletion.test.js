import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import MachineTask from "../src/models/machineTask.model.js";
import MaintenanceRecord from "../src/models/maintenanceRecord.model.js";

let token, machineId, planId, otherToken, otherMachineId, memberToken;

function auth(t) {
  return ["Authorization", `Bearer ${t}`];
}

async function registerOwner(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body.accessToken;
}

// Un miembro común (rol `user`, no admin) entra por el flujo real:
// solicitud -> aprobación -> verificación del código.
async function joinWorkshop(t, code) {
  const join = await request(app)
    .post("/api/workshops/join")
    .set(...auth(t))
    .send({ code });
  expect(join.status).toBe(201);

  const approve = await request(app)
    .patch(`/api/workshops/requests/${join.body._id}`)
    .set(...auth(token))
    .send({ status: "approved" });
  expect(approve.status).toBe(200);

  const verify = await request(app)
    .post("/api/workshops/verify-code")
    .set(...auth(t))
    .send({ code: approve.body.code });
  expect(verify.status).toBe(200);
}

async function createMachine(t, serial) {
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(t))
    .send({
      name: "Maquina De Cierre De Plan",
      brand: "Marca",
      model: "Modelo",
      tipo: "maquina",
      serialNumber: serial,
    });
  return res.body._id;
}

beforeAll(async () => {
  token = await registerOwner("planClose@test.com");
  await request(app)
    .post("/api/workshops")
    .set(...auth(token))
    .send({ name: "Taller Cierre De Planes" });

  machineId = await createMachine(token, "CLOSE-0001");

  const plan = await request(app)
    .post(`/api/machine/${machineId}/plans`)
    .set(...auth(token))
    .send({
      title: "Mantenimiento mensual de cierre",
      frequency: "monthly",
      startDate: "2026-09-01",
      tasks: [
        { title: "Revisar nivel de aceite" },
        { title: "Apretar tornillos del chasis" },
        { title: "Limpiar filtros de aire" },
      ],
    });
  expect(plan.status).toBe(201);
  planId = plan.body._id;

  // Un segundo taller, para probar que el aislamiento sigue en pie.
  otherToken = await registerOwner("planOther@test.com");
  await request(app)
    .post("/api/workshops")
    .set(...auth(otherToken))
    .send({ name: "Taller Ajeno" });
  otherMachineId = await createMachine(otherToken, "CLOSE-9999");

  memberToken = await registerOwner("planMember@test.com");
  await joinWorkshop(
    memberToken,
    (await request(app).get("/api/workshops/mine").set(...auth(token))).body.code,
  );
});

describe("completing maintenance plans", () => {
  it("starts with all tasks pending and the plan active", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("active");
    expect(res.body.tasks).toHaveLength(3);
    expect(res.body.tasks.every((t) => t.status === "pending")).toBe(true);
  });

  it("a member can mark a single task as done", async () => {
    const plan = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));
    const first = plan.body.tasks[0];

    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${first._id}/status`)
      .set(...auth(token))
      .send({ status: "done" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
  });

  it("a plain member (not the owner, not an admin) can complete a task", async () => {
    const plan = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(memberToken));
    expect(plan.status).toBe(200);
    const target = plan.body.tasks.find((t) => t.status !== "done");

    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${target._id}/status`)
      .set(...auth(memberToken))
      .send({ status: "done" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
  });

  it("the done state survives a reload (progress is real, not local)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));

    // Las dos tareas que marcamos antes (una el dueño, otra el miembro)
    // tienen que seguir en `done` al releer, no solo en el state del cliente.
    const hechas = res.body.tasks.filter((t) => t.status === "done");
    expect(hechas).toHaveLength(2);
  });

  it("a task can be reopened back to pending", async () => {
    const plan = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));
    const done = plan.body.tasks.find((t) => t.status === "done");

    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${done._id}/status`)
      .set(...auth(token))
      .send({ status: "pending" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
  });

  it("marking the plan performed closes every remaining task", async () => {
    const before = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));
    expect(before.body.tasks.some((t) => t.status !== "done")).toBe(true);

    const res = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/performed`)
      .set(...auth(token))
      .send({ performedAt: "2026-09-15", notes: "Ciclo cerrado" });

    expect(res.status).toBe(200);

    // El plan devuelto no puede venir con las tareas viejas ya cacheadas:
    // la UI redibuja el progreso straight de esta respuesta.
    expect(res.body.tasks).toHaveLength(3);
    expect(res.body.tasks.every((t) => t.status === "done")).toBe(true);

    const tasks = await MachineTask.find({ machineId });
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.status === "done")).toBe(true);
  });

  it("marking the plan performed creates a history record", async () => {
    const records = await MaintenanceRecord.find({ planId });
    expect(records).toHaveLength(1);
    expect(records[0].machineId.toString()).toBe(machineId);
    expect(records[0].title).toBe("Mantenimiento mensual de cierre");
  });

  it("the new record shows up in the workshop history endpoint", async () => {
    const res = await request(app)
      .get("/api/records")
      .set(...auth(token));

    expect(res.status).toBe(200);
    const found = res.body.items.find((r) => r.planId?._id === planId);
    expect(found).toBeTruthy();
  });

  it("the record is not visible to another workshop", async () => {
    const res = await request(app)
      .get("/api/records")
      .set(...auth(otherToken));

    expect(res.status).toBe(200);
    expect(res.body.items.some((r) => r.planId?._id === planId)).toBe(false);
  });

  it("marking performed rolls nextDue forward and keeps the plan active", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));

    expect(res.body.status).toBe("active");
    expect(new Date(res.body.nextDue).getTime()).toBeGreaterThan(
      new Date("2026-09-15").getTime(),
    );
  });

  it("a plan can be paused and resumed", async () => {
    const pause = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/status`)
      .set(...auth(token))
      .send({ status: "inactive" });
    expect(pause.status).toBe(200);
    expect(pause.body.status).toBe("inactive");

    const resume = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/status`)
      .set(...auth(token))
      .send({ status: "active" });
    expect(resume.status).toBe(200);
    expect(resume.body.status).toBe("active");
  });

  it("pausing does not create or delete tasks", async () => {
    const plan = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));
    expect(plan.body.tasks).toHaveLength(3);
  });

  it("rejects an invalid plan status (400)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/status`)
      .set(...auth(token))
      .send({ status: "archived" });
    expect(res.status).toBe(400);
  });

  it("another workshop cannot pause, complete or read the plan", async () => {
    const pause = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/status`)
      .set(...auth(otherToken))
      .send({ status: "inactive" });
    expect(pause.status).toBe(403);

    const performed = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/performed`)
      .set(...auth(otherToken))
      .send({ performedAt: "2026-09-16" });
    expect(performed.status).toBe(403);

    const read = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(otherToken));
    expect(read.status).toBe(403);
  });

  it("another workshop cannot complete its tasks either", async () => {
    const plan = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));
    const task = plan.body.tasks[0];

    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${task._id}/status`)
      .set(...auth(otherToken))
      .send({ status: "pending" });

    expect(res.status).toBe(403);
    expect(otherMachineId).toBeTruthy();
  });
});

describe("credentials never leak in auth responses", () => {
  it("register does not return the password hash", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        name: "Sin Hash Register",
        email: "nohashregister@test.com",
        password: "12345678",
      });

    expect(res.status).toBe(201);
    expect(res.body.user.password).toBeUndefined();
  });

  it("login does not return the password hash", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "nohashregister@test.com", password: "12345678" });

    expect(res.status).toBe(200);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.accessToken).toBeTruthy();
  });

  it("the refresh token travels in a cookie, not in the body", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "nohashregister@test.com", password: "12345678" });

    expect(res.body.refreshToken).toBeUndefined();
    expect(String(res.headers["set-cookie"])).toContain("refreshToken=");
  });

  it("refresh does not return the password hash either", async () => {
    const login = await request(app)
      .post("/api/login")
      .send({ email: "nohashregister@test.com", password: "12345678" });

    const cookie = login.headers["set-cookie"].map((c) => c.split(";")[0]);

    const refreshed = await request(app).post("/api/refresh").set("Cookie", cookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user.password).toBeUndefined();
  });
});
