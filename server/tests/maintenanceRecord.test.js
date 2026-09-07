import request from "supertest";
import { it, expect } from "vitest";
import { app } from "./setup.js";

it("should create a record and list it", async () => {
  // 1. Register + login
  await request(app).post("/api/register").send({
    name: "Record Tester",
    email: "record@test.com",
    password: "12345678",
  });
  const loginRes = await request(app)
    .post("/api/login")
    .send({ email: "record@test.com", password: "12345678" });
  const token = loginRes.body.accessToken;

  // 1b. Create workshop
  await request(app)
    .post("/api/workshops")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Record Workshop" });

  // 2. Create machine (token is DEFINITELY set)
  const machineRes = await request(app)
    .post("/api/machine")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Test Machine for Records XYZ",
      brand: "Test",
      model: "T-1000",
      serialNumber: "T1000-REC-2024-001",
      status: "active",
    });

  const mId = machineRes.body._id;

  // 3. Create record (mId is DEFINITELY a real ObjectId)
  const recordRes = await request(app)
    .post(`/api/machine/${mId}/records`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Oil change and filter replacement",
      performedAt: "2026-07-10T08:00:00.000Z",
      duration: 120,
      cost: 350.5,
      technician: "John Doe",
      results: "All systems operational",
    });
  expect(recordRes.status).toBe(201);
  expect(recordRes.body.machineId._id).toBe(mId);

  // 4. List records
  const listRes = await request(app)
    .get(`/api/machine/${mId}/records`)
    .set("Authorization", `Bearer ${token}`);
  expect(listRes.status).toBe(200);
  expect(listRes.body.items.length).toBe(1);

  // 5. List all records (global endpoint) with pagination
  const allRes = await request(app)
    .get("/api/records")
    .set("Authorization", `Bearer ${token}`);
  expect(allRes.status).toBe(200);
  expect(allRes.body.items.length).toBe(1);
  expect(allRes.body.meta).toEqual({
    total: 1,
    page: 1,
    limit: 15,
    pages: 1,
  });
});
