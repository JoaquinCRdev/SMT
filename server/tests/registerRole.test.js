import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import User from "../src/models/user.model.js";

// El rol NO se elige al registrarse: lo define la acción posterior (crear un
// taller deja "admin", unirse a uno deja "user"). El formulario llegó a mandar
// un `role` que el backend ignoraba en silencio, así que estos tests fijan el
// contrato: el campo no cambia el rol y no rompe el alta.

async function register(payload) {
  return request(app).post("/api/register").send(payload);
}

const auth = (token) => ["Authorization", `Bearer ${token}`];

let base;
beforeAll(async () => {
  base = await register({
    name: "Registro Base",
    email: "registroBase@test.com",
    password: "12345678",
  });
});

describe("POST /api/register — rol", () => {
  it("crea la cuenta con role 'user' (201)", async () => {
    expect(base.status).toBe(201);
    expect(base.body.user.role).toBe("user");
    expect(base.body.accessToken).toBeTruthy();

    const guardado = await User.findOne({ email: "registroBase@test.com" });
    expect(guardado.role).toBe("user");
  });

  it("ignora role 'admin' en el body: el usuario igual queda 'user'", async () => {
    const res = await register({
      name: "Quiere Ser Admin",
      email: "quiereAdmin@test.com",
      password: "12345678",
      role: "admin",
    });

    // No debe fallar (el esquema descarta la clave desconocida) pero tampoco
    // debe otorgar el rol.
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");

    const guardado = await User.findOne({ email: "quiereAdmin@test.com" });
    expect(guardado.role).toBe("user");
    expect(guardado.workshop).toBeFalsy();
  });

  it("ignora cualquier rol inventado sin romper el alta", async () => {
    const res = await register({
      name: "Rol Inventado",
      email: "rolInventado@test.com",
      password: "12345678",
      role: "superadmin",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });

  it("el usuario recién registrado no puede listar usuarios (admin-only)", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(...auth(base.body.accessToken));

    expect(res.status).toBe(403);
  });

  it("crear un taller sí lo deja 'admin'", async () => {
    const res = await request(app)
      .post("/api/workshops")
      .set(...auth(base.body.accessToken))
      .send({ name: "Taller Del Registro" });

    expect(res.status).toBe(201);

    const guardado = await User.findOne({ email: "registroBase@test.com" });
    expect(guardado.role).toBe("admin");
  });

  it("rechaza un email repetido (409)", async () => {
    const res = await register({
      name: "Email Repetido",
      email: "registroBase@test.com",
      password: "12345678",
    });

    expect(res.status).toBe(409);
  });

  it("rechaza una contraseña corta (400)", async () => {
    const res = await register({
      name: "Pass Corta",
      email: "passCorta@test.com",
      password: "123",
    });

    expect(res.status).toBe(400);
  });

  it("el registro posterior a 'admin' no filtra el rol por /profile si no hay taller", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set(...auth(base.body.accessToken));

    expect(res.status).toBe(200);
    // Ya es admin porque creó el taller en el test anterior.
    expect(res.body.role).toBe("admin");
  });
});
