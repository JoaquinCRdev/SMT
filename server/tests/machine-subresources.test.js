import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";

let ownerAToken, ownerBToken, memberToken, strangerToken;
let ownerAId, ownerBId;
let workshopAId, workshopBId;
let machineAId, machineBId;
let docId, imageId, taskId;

async function registerAndLogin(email) {
  await request(app)
    .post("/api/register")
    .send({ name: email.split("@")[0], email, password: "12345678" });
  const res = await request(app)
    .post("/api/login")
    .send({ email, password: "12345678" });
  return { token: res.body.accessToken, userId: res.body.user._id };
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

async function createMachine(token, serial) {
  const res = await request(app)
    .post("/api/machine")
    .set(...auth(token))
    .send({
      name: `Machine ${serial} Longer Name`,
      brand: "Brand",
      model: "Model",
      serialNumber: serial,
      status: "active",
    });
  return res.body._id;
}

beforeAll(async () => {
  const a = await registerAndLogin("subOwnerA@test.com");
  ownerAToken = a.token;
  ownerAId = a.userId;
  workshopAId = await createWorkshop(ownerAToken, "Sub Workshop A");

  const b = await registerAndLogin("subOwnerB@test.com");
  ownerBToken = b.token;
  ownerBId = b.userId;
  workshopBId = await createWorkshop(ownerBToken, "Sub Workshop B");

  strangerToken = (await registerAndLogin("subStranger@test.com")).token;
  memberToken = (await registerAndLogin("subMember@test.com")).token;

  machineAId = await createMachine(ownerAToken, "SUB-MACH-001");
  machineBId = await createMachine(ownerBToken, "SUB-MACH-B1");
});

describe("machine documents", () => {
  const payload = {
    fileName: "Guia Manual de Retroceso",
    fileUrl: "https://s3.example.com/manual.pdf",
    storagePath: "machines/manual.pdf",
    fileType: "pdf",
    fileSize: 12345,
  };

  it("owner A uploads a document to their machine", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/documents`)
      .set(...auth(ownerAToken))
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.fileName).toBe(payload.fileName);
    docId = res.body._id;
  });

  it("owner A lists their machine documents", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/documents`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it("owner A gets a document by id", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/documents/${docId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(docId.toString());
  });

  it("owner A updates a document", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineAId}/documents/${docId}`)
      .set(...auth(ownerAToken))
      .send({ fileName: "Guia Manual Revisada" });
    expect(res.status).toBe(200);
    expect(res.body.fileName).toBe("Guia Manual Revisada");
  });

  it("owner A cannot read Workshop B's document (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/documents/${docId}`)
      .set(...auth(ownerBToken));
    expect(res.status).toBe(403);
  });

  it("owner A deletes a document", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineAId}/documents/${docId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
  });

  it("stranger cannot upload a document to a machine (403)", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/documents`)
      .set(...auth(strangerToken))
      .send(payload);
    expect(res.status).toBe(403);
  });
});

describe("machine images", () => {
  it("owner A adds an image to their machine", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/images`)
      .set(...auth(ownerAToken))
      .send({ imageUrl: "https://img.example.com/a.png", altText: "Front view" });
    expect(res.status).toBe(201);
    imageId = res.body._id;
  });

  it("owner A lists machine images", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/images`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("owner A updates an image", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineAId}/images/${imageId}`)
      .set(...auth(ownerAToken))
      .send({ altText: "Back view" });
    expect(res.status).toBe(200);
    expect(res.body.altText).toBe("Back view");
  });

  it("owner A reorders an image", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineAId}/images/${imageId}/order`)
      .set(...auth(ownerAToken))
      .send({ sortOrder: 5 });
    expect(res.status).toBe(200);
    expect(res.body.sortOrder).toBe(5);
  });

  it("owner B cannot update Workshop A's image (403)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineAId}/images/${imageId}`)
      .set(...auth(ownerBToken))
      .send({ altText: "Hacked" });
    expect(res.status).toBe(403);
    expect(res.body.altText).toBeUndefined();
  });

  it("owner A deletes an image", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineAId}/images/${imageId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
  });
});

describe("machine tasks", () => {
  it("owner A creates a task on their machine", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineAId}/tasks`)
      .set(...auth(ownerAToken))
      .send({ title: "Revisar correas de impresión", priority: "high" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Revisar correas de impresión");
    taskId = res.body._id;
  });

  it("owner A lists tasks with a status filter", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/tasks`)
      .query({ status: "pending" })
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("owner A gets a task by id", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/tasks/${taskId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(taskId.toString());
  });

  it("owner A changes task status", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineAId}/tasks/${taskId}/status`)
      .set(...auth(ownerAToken))
      .send({ status: "in_progress" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
  });

  it("rejects an invalid task status (400)", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineAId}/tasks/${taskId}/status`)
      .set(...auth(ownerAToken))
      .send({ status: "bogus" });
    expect(res.status).toBe(400);
  });

  it("owner A updates a task", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineAId}/tasks/${taskId}`)
      .set(...auth(ownerAToken))
      .send({ description: "Ajustar tensión de la correa" });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Ajustar tensión de la correa");
  });

  it("owner B cannot access Workshop A's task (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/tasks/${taskId}`)
      .set(...auth(ownerBToken));
    expect(res.status).toBe(403);
  });

  it("owner A deletes a task", async () => {
    const res = await request(app)
      .delete(`/api/machine/${machineAId}/tasks/${taskId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
  });
});

describe("task logs", () => {
  it("owner A logs are created for tasks and returned by machine", async () => {
    await request(app)
      .post(`/api/machine/${machineAId}/tasks`)
      .set(...auth(ownerAToken))
      .send({ title: "Tarea para loguear actividad" });

    const res = await request(app)
      .get(`/api/machine/${machineAId}/tasklogs`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("owner A logs are returned by task id", async () => {
    const create = await request(app)
      .post(`/api/machine/${machineAId}/tasks`)
      .set(...auth(ownerAToken))
      .send({ title: "Tarea para log por tarea" });
    const newTaskId = create.body._id;

    const res = await request(app)
      .get(`/api/machine/${machineAId}/tasklogs/task/${newTaskId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    for (const log of res.body) {
      expect(log.taskId._id.toString()).toBe(newTaskId.toString());
    }
  });

  it("owner B cannot read Workshop A's machine task logs (403)", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineAId}/tasklogs`)
      .set(...auth(ownerBToken));
    expect(res.status).toBe(403);
  });

  it("owner A can fetch their own per-user task logs (top-level)", async () => {
    const res = await request(app)
      .get(`/api/tasklogs/user/${ownerAId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("owner A cannot read owner B's logs (403)", async () => {
    const res = await request(app)
      .get(`/api/tasklogs/user/${ownerBId}`)
      .set(...auth(ownerAToken));
    expect(res.status).toBe(403);
  });

  it("stranger cannot read someone else's logs (403)", async () => {
    const res = await request(app)
      .get(`/api/tasklogs/user/${ownerAId}`)
      .set(...auth(strangerToken));
    expect(res.status).toBe(403);
  });
});

describe("workshop-scoped machine list", () => {
  it("owner A's list only contains Workshop A machines", async () => {
    const res = await request(app)
      .get("/api/machine")
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    for (const m of res.body.items) {
      expect(m.workshopId._id.toString()).toBe(workshopAId.toString());
    }
  });

  it("owner B's list only contains Workshop B machines", async () => {
    const res = await request(app)
      .get("/api/machine")
      .set(...auth(ownerBToken));
    expect(res.status).toBe(200);
    for (const m of res.body.items) {
      expect(m.workshopId._id.toString()).toBe(workshopBId.toString());
    }
  });

  it("stranger with no workshop gets empty list", async () => {
    const res = await request(app)
      .get("/api/machine")
      .set(...auth(strangerToken));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(0);
  });
});

describe("workshop members roster", () => {
  it("owner A sees member roster including themselves", async () => {
    const res = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(ownerAToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("stranger with no workshop gets 404", async () => {
    const res = await request(app)
      .get("/api/workshops/mine/members")
      .set(...auth(strangerToken));
    expect(res.status).toBe(404);
  });
});