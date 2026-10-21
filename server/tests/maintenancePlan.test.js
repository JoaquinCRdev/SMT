import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import MachineTask from "../src/models/machineTask.model.js";
import MaintenancePlan from "../src/models/maintenancePlan.model.js";
import TaskLog from "../src/models/Tasklog.model.js";

let token, machineId, planId, workshopCode;

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body.accessToken;
}

async function loginUser(email) {
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body;
}

function auth(token) {
  return ["Authorization", `Bearer ${token}`];
}

beforeAll(async () => {
  token = await registerAndLogin("planOwner@test.com");
  await request(app)
    .post("/api/workshops")
    .set(...auth(token))
    .send({ name: "Plans Workshop Name" });
  workshopCode = (
    await request(app).get("/api/workshops/mine").set(...auth(token))
  ).body.code;
  const machine = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name: "Maquina Para Planes Test",
      brand: "Brand",
      model: "Model",
      tipo: "maquina",
      serialNumber: "PLAN-0001",
    });
  machineId = machine.body._id;
});

describe("maintenance plans", () => {
  it("creates a plan with nested tasks (201)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Mantenimiento preventivo mensual completo",
        description: "Revision general",
        frequency: "monthly",
        startDate: "2026-09-01",
        tasks: [{ title: "Lubricar todos los ejes" }],
        notes: "Equipo prioridad alta",
      });
    expect(res.status).toBe(201);
    planId = res.body._id;
    expect(res.body.status).toBe("active");
    expect(res.body.frequency).toBe("monthly");
    expect(res.body.nextDue).toBeTruthy();
    expect(res.body.tasks.length).toBe(1);
  });

  it("requires customDays when frequency is custom (400)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan con frecuencia custom sin dias",
        frequency: "custom",
        startDate: "2026-09-01",
      });
    expect(res.status).toBe(400);
  });

  it("creates a custom-frequency plan when customDays is provided (201)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan custom cada 45 dias",
        frequency: "custom",
        customDays: 45,
        startDate: "2026-09-01",
      });
    expect(res.status).toBe(201);
  });

  it("lists plans for the machine (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.items.length).toBe(2);
  });

  it("gets a single plan by id (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(planId);
  });

  it("updates the plan frequency (200)", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token))
      .send({ frequency: "weekly" });
    expect(res.status).toBe(200);
    expect(res.body.frequency).toBe("weekly");
  });

  it("marks a plan as performed and recomputes nextDue (200)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/performed`)
      .set(...auth(token))
      .send({ performedAt: "2026-09-10", notes: "Trabajo completado" });
    expect(res.status).toBe(200);
    expect(res.body.lastPerformed).toBeTruthy();
    expect(res.body.notes).toContain("Trabajo completado");
  });

  it("deletes the plan and its tasks (200)", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineId}/plans/${planId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);

    const list = await request(app)
      .get(`/api/machine/${machineId}/plans`)
      .set(...auth(token));
    expect(list.body.meta.total).toBe(1);
  });
});

describe("workshop-wide plans", () => {
  it("lists every plan in the workshop with machine and assignee data (200)", async () => {
    const res = await request(app)
      .get("/api/plans")
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    const plan = res.body.items[0];
    expect(plan.machineId.name).toBe("Maquina Para Planes Test");
    expect(plan.assignedTo).toEqual([]);
  });

  it("filters the workshop-wide list by machineId (200)", async () => {
    const res = await request(app)
      .get(`/api/plans?machineId=${machineId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
  });

  it("a foreign machineId in the query cannot leak another workshop's plans", async () => {
    const otherToken = await registerAndLogin("plansLeak@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(otherToken))
      .send({ name: "Leak Plans Workshop" });
    const otherMachine = await request(app)
      .post("/api/machine")
      .set(...auth(otherToken))
      .send({
        name: "Maquina De Otro Taller Test",
        brand: "Brand",
        model: "Model",
        tipo: "maquina",
        serialNumber: "LEAK-0001",
      });
    await request(app)
      .post(`/api/machine/${otherMachine.body._id}/plans`)
      .set(...auth(otherToken))
      .send({
        title: "Plan privado de otro taller",
        frequency: "monthly",
        startDate: "2026-10-01",
      });

    const res = await request(app)
      .get(`/api/plans?machineId=${otherMachine.body._id}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it("requires a workshop to list plans (403)", async () => {
    const orphan = await registerAndLogin("plansOrphan@test.com");
    const res = await request(app)
      .get("/api/plans")
      .set(...auth(orphan));
    expect(res.status).toBe(403);
  });

  it("does not leak plans from another workshop (200)", async () => {
    const otherToken = await registerAndLogin("plansOther@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(otherToken))
      .send({ name: "Other Plans Workshop" });

    const res = await request(app)
      .get("/api/plans")
      .set(...auth(otherToken));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });

  it("assigns a plan-level member and rejects non-members (201/400)", async () => {
    const memberEmail = "plansMember@test.com";
    const memberToken = await registerAndLogin(memberEmail);
    const memberId = (await loginUser(memberEmail)).user._id;

    await request(app)
      .post("/api/workshops/join")
      .set(...auth(memberToken))
      .send({ code: workshopCode });
    const pending = (
      await request(app).get("/api/workshops/requests").set(...auth(token))
    ).body[0];
    const approved = await request(app)
      .patch(`/api/workshops/requests/${pending._id}`)
      .set(...auth(token))
      .send({ status: "approved" });
    await request(app)
      .post("/api/workshops/verify-code")
      .set(...auth(memberToken))
      .send({ code: approved.body.code });

    const ok = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan asignado a un miembro del taller",
        frequency: "monthly",
        startDate: "2026-10-01",
        assignedTo: [memberId],
      });
    expect(ok.status).toBe(201);
    expect(ok.body.assignedTo[0]._id).toBe(memberId);

    const strangerEmail = "plansStranger@test.com";
    await registerAndLogin(strangerEmail);
    const strangerId = (await loginUser(strangerEmail)).user._id;

    const bad = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan asignado a un usuario ajeno",
        frequency: "monthly",
        startDate: "2026-10-01",
        assignedTo: [strangerId],
      });
    expect(bad.status).toBe(400);
  });

  it("rejects a malformed assignedTo id (400)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan con assignedTo invalido",
        frequency: "monthly",
        startDate: "2026-10-01",
        assignedTo: ["no-es-un-objectid"],
      });
    expect(res.status).toBe(400);
  });
});

describe("borrar una tarea de un plan", () => {
  let planConTareas, tareaA, tareaB;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan con dos tareas para borrar",
        frequency: "monthly",
        startDate: "2026-10-01",
        tasks: [
          { title: "Revisar nivel de aceite" },
          { title: "Limpiar filtros de aire" },
        ],
      });
    planConTareas = res.body._id;
    tareaA = res.body.tasks[0]._id;
    tareaB = res.body.tasks[1]._id;
  });

  it("removes the task from the plan and deletes the document (200)", async () => {
    const res = await request(app)
      .delete(
        `/api/machine/${machineId}/plans/${planConTareas}/tasks/${tareaA}`,
      )
      .set(...auth(token));
    expect(res.status).toBe(200);

    // El plan ya no guarda el id de la tarea borrada.
    const plan = await MaintenancePlan.findById(planConTareas);
    expect(plan.tasks.map((t) => String(t))).toEqual([String(tareaB)]);

    // Y el documento de la tarea ya no existe.
    expect(await MachineTask.findById(tareaA)).toBeNull();
    expect(await MachineTask.findById(tareaB)).not.toBeNull();
  });

  it("logs the deletion (200)", async () => {
    const logs = await TaskLog.find({ taskId: tareaA, action: "deleted" });
    expect(logs.length).toBe(1);
    expect(logs[0].userId).toBeTruthy();
  });

  it("returns the plan without the task when it is read (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans/${planConTareas}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBe(1);
    expect(res.body.tasks[0]._id).toBe(tareaB);
  });

  it("rejects deleting the same task twice (404)", async () => {
    const res = await request(app)
      .delete(
        `/api/machine/${machineId}/plans/${planConTareas}/tasks/${tareaA}`,
      )
      .set(...auth(token));
    expect(res.status).toBe(404);
  });

  it("rejects a task that belongs to another plan (404)", async () => {
    const otro = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan sin la tarea buscada",
        frequency: "monthly",
        startDate: "2026-10-01",
      });

    const res = await request(app)
      .delete(
        `/api/machine/${machineId}/plans/${otro.body._id}/tasks/${tareaB}`,
      )
      .set(...auth(token));
    expect(res.status).toBe(404);

    // La tarea sigue viva: el intento no la tocó.
    expect(await MachineTask.findById(tareaB)).not.toBeNull();
  });

  it("rejects a malformed task id (400)", async () => {
    const res = await request(app)
      .delete(
        `/api/machine/${machineId}/plans/${planConTareas}/tasks/no-es-un-objectid`,
      )
      .set(...auth(token));
    expect(res.status).toBe(400);
  });

  it("does not let another workshop delete the task (403)", async () => {
    const otherToken = await registerAndLogin("planTaskOther@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(otherToken))
      .send({ name: "Otro Taller Para Tareas" });

    const res = await request(app)
      .delete(
        `/api/machine/${machineId}/plans/${planConTareas}/tasks/${tareaB}`,
      )
      .set(...auth(otherToken));
    expect(res.status).toBe(403);

    // Tampoco la puede borrar pasando su propia maquina.
    const otherMachine = await request(app)
      .post("/api/machine")
      .set(...auth(otherToken))
      .send({
        name: "Maquina De Otro Taller Para Tareas",
        brand: "Brand",
        model: "Model",
        tipo: "maquina",
        serialNumber: "TAREA-0001",
      });
    const res2 = await request(app)
      .delete(
        `/api/machine/${otherMachine.body._id}/plans/${planConTareas}/tasks/${tareaB}`,
      )
      .set(...auth(otherToken));
    expect(res2.status).toBe(403);

    expect(await MachineTask.findById(tareaB)).not.toBeNull();
  });

  it("the machine-scoped delete also takes the task out of the plan (200)", async () => {
    const plan = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan para borrar la tarea por la maquina",
        frequency: "monthly",
        startDate: "2026-10-01",
        tasks: [{ title: "Tarea que se borra desde la maquina" }],
      });
    const planId = plan.body._id;
    const taskId = plan.body.tasks[0]._id;

    const res = await request(app)
      .delete(`/api/machine/${machineId}/tasks/${taskId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);

    // Antes el plan se quedaba guardando el id de una tarea inexistente.
    const guardado = await MaintenancePlan.findById(planId);
    expect(guardado.tasks.length).toBe(0);
  });
});