import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./setup.js";

let accessToken;
let machineId;
let planId;

describe("POST /api/register & login (setup)", () => {
  it("should register, login, and create a workshop", async () => {
    await request(app).post("/api/register").send({
      name: "Test User",
      email: "test@test.com",
      password: "12345678",
    });

    const loginRes = await request(app)
      .post("/api/login")
      .send({ email: "test@test.com", password: "12345678" });

    accessToken = loginRes.body.accessToken;

    const workshopRes = await request(app)
      .post("/api/workshops")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Test Workshop" });

    expect(workshopRes.status).toBe(201);
  });
});

describe("POST /api/machine (setup)", () => {
  it("should create a machine", async () => {
    const res = await request(app)
      .post("/api/machine")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "CNC Milling Machine X3000",
        brand: "Haas",
        model: "VF-2SS",
        serialNumber: "HAAS-VF2-2024-001",
        description: "Vertical machining center",
        status: "active",
      });

    expect(res.status).toBe(201);
    machineId = res.body._id;
  });
});

describe("Maintenance Plans — /api/machine/:machineId/plans", () => {
  it("should create a plan with tasks", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Monthly Preventive Maintenance",
        description: "Standard monthly checkup",
        frequency: "monthly",
        startDate: "2026-07-13",
        tasks: [
          { title: "Check oil levels", priority: "high" },
          { title: "Clean filters", priority: "medium" },
        ],
        notes: "First maintenance cycle",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.frequency).toBe("monthly");
    expect(res.body.nextDue).toBeDefined();
    planId = res.body._id;
  });

  it("should reject when custom frequency lacks customDays", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Custom Plan Without Days",
        frequency: "custom",
        startDate: "2026-07-13",
      });

    expect(res.status).toBe(400);
  });

  it("should list plans for the machine", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it("should get a single plan by id", async () => {
    const res = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(planId);
    expect(res.body.tasks).toHaveLength(2);
  });

  it("should update a plan", async () => {
    const res = await request(app)
      .put(`/api/machine/${machineId}/plans/${planId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated Monthly Plan", notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Monthly Plan");
    expect(res.body.notes).toBe("Updated notes");
  });

  it("should mark plan as performed and update nextDue", async () => {
    const res = await request(app)
      .patch(`/api/machine/${machineId}/plans/${planId}/performed`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ notes: "Completed on schedule" });

    expect(res.status).toBe(200);
    expect(res.body.lastPerformed).toBeDefined();
    expect(new Date(res.body.nextDue).getTime()).toBeGreaterThan(
      new Date(res.body.lastPerformed).getTime(),
    );
  });

  it("should reject without authentication", async () => {
    const res = await request(app)
      .post(`/api/machine/${machineId}/plans`)
      .send({
        title: "Unauthorized",
        frequency: "daily",
        startDate: "2026-07-13",
      });

    expect(res.status).toBe(401);
  });

  it("should delete the plan and its tasks", async () => {
    const delRes = await request(app)
      .delete(`/api/machine/${machineId}/plans/${planId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(delRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/machine/${machineId}/plans/${planId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.status).toBe(404);
  });
});
