import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import MachineDocument from "../src/models/machineDocument.model.js";
import MachineImage from "../src/models/machineImage.model.js";
import MachineTask from "../src/models/machineTask.model.js";
import MaintenancePlan from "../src/models/maintenancePlan.model.js";
import MaintenanceRecord from "../src/models/maintenanceRecord.model.js";
import TaskLog from "../src/models/Tasklog.model.js";

let token, userId;
let machineId;
let userIdB, tokenB;
let docId, imageId, taskId, task2Id;

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return res.body;
}

function auth(token) {
  return ["Authorization", `Bearer ${token}`];
}

beforeAll(async () => {
  const owner = await registerAndLogin("subOwner@test.com");
  token = owner.accessToken;
  userId = owner.user._id;

  await request(app)
    .post("/api/workshops")
    .set(...auth(token))
    .send({ name: "Subresources Workshop" });

  const machine = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name: "Maquina Subrecursos Test",
      brand: "Brand",
      model: "Model",
      tipo: "maquina",
      serialNumber: "SUBRES-0001",
    });
  machineId = machine.body._id;

  const other = await registerAndLogin("subMember@test.com");
  tokenB = other.accessToken;
  userIdB = other.user._id;

  await request(app)
    .post("/api/workshops/join")
    .set(...auth(tokenB))
    .send({ code: (await request(app).get("/api/workshops/mine").set(...auth(token))).body.code });
  const pending = (await request(app).get("/api/workshops/requests").set(...auth(token))).body[0];
  const approved = await request(app)
    .patch(`/api/workshops/requests/${pending._id}`)
    .set(...auth(token))
    .send({ status: "approved" });

  await request(app)
    .post("/api/workshops/verify-code")
    .set(...auth(tokenB))
    .send({ code: approved.body.code });
});

describe("machine documents", () => {
  it("creates a document (201)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/documents`)
      .set(...auth(token))
      .send({
        fileName: "Manual De Operacion X",
        fileUrl: "https://cdn.example.com/manual-x.pdf",
        storagePath: "machines/manual-x.pdf",
        fileType: "pdf",
        fileSize: 2048,
      });
    expect(res.status).toBe(201);
    docId = res.body._id;
  });

  it("lists documents for the machine (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/documents`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it("gets a single document by id (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/documents/${docId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.fileType).toBe("pdf");
  });

  it("updates a document (200)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/documents/${docId}`)
      .set(...auth(token))
      .send({ fileSize: 4096 });
    expect(res.status).toBe(200);
    expect(res.body.fileSize).toBe(4096);
  });

  it("rejects an invalid fileType on create (400)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/documents`)
      .set(...auth(token))
      .send({
        fileName: "Archivo Invalido",
        fileUrl: "https://cdn.example.com/bad.exe",
        storagePath: "machines/bad.exe",
        fileType: "exe",
        fileSize: 10,
      });
    expect(res.status).toBe(400);
  });

  it("deletes a document (200)", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineId}/documents/${docId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
  });
});

describe("machine images", () => {
  it("adds an image (201)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/images`)
      .set(...auth(token))
      .send({ imageUrl: "https://cdn.example.com/front.png", altText: "Vista frontal", sortOrder: 1 });
    expect(res.status).toBe(201);
    imageId = res.body._id;
  });

  it("lists images for the machine (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/images`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it("updates an image (200)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/images/${imageId}`)
      .set(...auth(token))
      .send({ altText: "Vista lateral" });
    expect(res.status).toBe(200);
    expect(res.body.altText).toBe("Vista lateral");
  });

  it("reorders an image (200)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/images/${imageId}/order`)
      .set(...auth(token))
      .send({ sortOrder: 5 });
    expect(res.status).toBe(200);
    expect(res.body.sortOrder).toBe(5);
  });

  it("rejects a negative sortOrder (400)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/images`)
      .set(...auth(token))
      .send({ imageUrl: "https://cdn.example.com/bad.png", sortOrder: -1 });
    expect(res.status).toBe(400);
  });

  it("deletes an image (200)", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineId}/images/${imageId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
  });
});

describe("machine tasks", () => {
  it("creates a task (201)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/tasks`)
      .set(...auth(token))
      .send({ title: "Revisar sistema hidraulico", priority: "high" });
    expect(res.status).toBe(201);
    taskId = res.body._id;
    expect(res.body.status).toBe("pending");
  });

  it("creates a second task for status-change tests (201)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/tasks`)
      .set(...auth(token))
      .send({ title: "Lubricar rodamientos eje principal" });
    expect(res.status).toBe(201);
    task2Id = res.body._id;
  });

  it("lists tasks for the machine (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/tasks`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("gets a single task by id (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/tasks/${taskId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Revisar sistema hidraulico");
  });

  it("updates a task (200)", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineId}/tasks/${taskId}`)
      .set(...auth(token))
      .send({ title: "Revisar bomba hidraulica completa" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Revisar bomba hidraulica completa");
  });

  it("changes task status to in_progress (200)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${taskId}/status`)
      .set(...auth(token))
      .send({ status: "in_progress" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
  });

  it("rejects an invalid task status (400)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${taskId}/status`)
      .set(...auth(token))
      .send({ status: "on_hold" });
    expect(res.status).toBe(400);
  });

  it("assigns a task to another member (200)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${taskId}/assign`)
      .set(...auth(token))
      .send({ assignedTo: userIdB });
    expect(res.status).toBe(200);
    expect(String(res.body.assignedTo)).toBe(String(userIdB));
  });

  it("rejects assigning a task to a user outside the workshop (400)", async () => {
    const outsider = await registerAndLogin("subOutsider@test.com");
    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${taskId}/assign`)
      .set(...auth(token))
      .send({ assignedTo: outsider.user._id });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed assignedTo id (400)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/tasks/${taskId}/assign`)
      .set(...auth(token))
      .send({ assignedTo: "no-es-un-objectid" });
    expect(res.status).toBe(400);
  });

  it("deletes the second task (200)", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineId}/tasks/${task2Id}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
  });
});

describe("task logs", () => {
  it("logs are generated from task activity", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/tasklogs`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("lists logs for a specific task (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/tasklogs/task/${taskId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("lists own logs by user id (200)", async () => {
    const res = await request(app)
      .get(`/api/tasklogs/user/${userId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("the admin cannot read another user's logs (403)", async () => {
    const res = await request(app)
      .get(`/api/tasklogs/user/${userIdB}`)
      .set(...auth(token));
    expect(res.status).toBe(403);
  });

  it("a member cannot see another member's logs (403)", async () => {
    const res = await request(app)
      .get(`/api/tasklogs/user/${userId}`)
      .set(...auth(tokenB));
    expect(res.status).toBe(403);
  });
});

describe("machine list & lifecycle", () => {
  it("machine list is paginated with meta info (200)", async () => {
    const res = await request(app)
      .get("/api/machine")
      .query({ page: 1, limit: 10 })
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ total: 1, page: 1, limit: 10 });
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("gets the machine by id with populated fields (200)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}`)
      .set(...auth(token));
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Maquina Subrecursos Test");
  });

  it("rejects an invalid machine id (400)", async () => {
    const res = await request(app).get("/api/machine/123").set(...auth(token));
    expect(res.status).toBe(400);
  });

  it("updating a machine normalizes a spanish status (200)", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineId}`)
      .set(...auth(token))
      .send({ status: "mantenimiento" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("maintenance");
  });

  it("deleting the machine cascades its subresources (200)", async () => {
    const del = await request(app)
      .delete(`/api/machine/${machineId}`)
      .set(...auth(token));
    expect(del.status).toBe(200);

    const docs = await request(app)
      .get(`/api/machine/${machineId}/documents`)
      .set(...auth(token));
    expect(docs.status).toBe(404);

    const machine = await request(app)
      .get(`/api/machine/${machineId}`)
      .set(...auth(token));
    expect(machine.status).toBe(404);
  });
});

describe("deleting a machine removes every dependent row", () => {
  // Los 404 de arriba no alcanzan: las rutas de subrecursos también dan 404
  // cuando la máquina ya no existe, aunque las filas sigan en la base. Esto
  // consulta las colecciones directamente.
  it("leaves no orphans in any machine-scoped collection", async () => {
    const created = await request(app)
      .post("/api/machine")
      .set(...auth(token))
      .send({
        name: "Maquina Para Cascada Test",
        brand: "Brand",
        model: "Model",
        tipo: "maquina",
        serialNumber: "CASCADE-0001",
      });
    expect(created.status).toBe(201);
    const target = created.body._id;

    const image = await request(app)
      .post(`/api/machine/${target}/images`)
      .set(...auth(token))
      .send({ imageUrl: "https://cdn.example.com/cascade.png" });
    expect(image.status).toBe(201);

    const document = await request(app)
      .post(`/api/machine/${target}/documents`)
      .set(...auth(token))
      .send({
        fileName: "manual-de-la-maquina.pdf",
        fileUrl: "https://docs.example.com/m.pdf",
        storagePath: "manuals/m.pdf",
        fileType: "pdf",
        fileSize: 2048,
      });
    expect(document.status).toBe(201);

    const task = await request(app)
      .post(`/api/machine/${target}/tasks`)
      .set(...auth(token))
      .send({ title: "Revisar niveles de aceite" });
    expect(task.status).toBe(201);

    const plan = await request(app)
      .post(`/api/machine/${target}/plans`)
      .set(...auth(token))
      .send({
        title: "Plan de cascada test",
        frequency: "monthly",
        startDate: new Date().toISOString(),
      });
    expect(plan.status).toBe(201);

    const record = await request(app)
      .post(`/api/machine/${target}/records`)
      .set(...auth(token))
      .send({
        title: "Registro de cascada test",
        performedAt: new Date().toISOString(),
      });
    expect(record.status).toBe(201);

    // Los task logs no tienen endpoint de alta (solo lectura), así que se
    // siembran por el modelo para poder comprobar la cascada.
    const taskLog = await TaskLog.create({
      machineId: target,
      taskId: task.body._id,
      userId,
      action: "created",
    });
    expect(taskLog).toBeTruthy();

    // Antes de borrar, cada colección tiene al menos una fila. TaskLog puede
    // tener más de una porque el alta de una tarea ya escribe su propio log.
    for (const [nombre, Model] of [
      ["MachineImage", MachineImage],
      ["MachineDocument", MachineDocument],
      ["MachineTask", MachineTask],
      ["TaskLog", TaskLog],
      ["MaintenancePlan", MaintenancePlan],
      ["MaintenanceRecord", MaintenanceRecord],
    ]) {
      expect(
        await Model.countDocuments({ machineId: target }),
        `${nombre} no tenía filas antes del borrado`,
      ).toBeGreaterThan(0);
    }

    const del = await request(app)
      .delete(`/api/machine/${target}`)
      .set(...auth(token));
    expect(del.status).toBe(200);

    for (const [nombre, Model] of [
      ["MachineImage", MachineImage],
      ["MachineDocument", MachineDocument],
      ["MachineTask", MachineTask],
      ["TaskLog", TaskLog],
      ["MaintenancePlan", MaintenancePlan],
      ["MaintenanceRecord", MaintenanceRecord],
    ]) {
      expect(
        await Model.countDocuments({ machineId: target }),
        `${nombre} conservó filas de la máquina borrada`,
      ).toBe(0);
    }
  });
});