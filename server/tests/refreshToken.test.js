import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import User from "../src/models/user.model.js";
import jwt from "jsonwebtoken";

const CRED = { name: "Rotacion", email: "rotacion@test.com", password: "12345678" };
const MAX_REFRESH_TOKENS = 5;

const cookieValue = (res) => {
  const raw = res.headers["set-cookie"];
  const jar = (Array.isArray(raw) ? raw : [raw]).find((c) =>
    c.startsWith("refreshToken="),
  );
  return jar ? jar.split(";")[0] : null;
};

const countTokens = async (email) => {
  const user = await User.findOne({ email }).select("+refreshTokens");
  return user.refreshTokens.length;
};

beforeAll(async () => {
  await request(app).post("/api/register").send(CRED);
});

describe("refresh token rotation", () => {
  it("issues a different token on each refresh", async () => {
    const login = await request(app)
      .post("/api/login")
      .send({ email: CRED.email, password: CRED.password });
    const original = cookieValue(login);

    const refreshed = await request(app)
      .post("/api/refresh")
      .set("Cookie", original);

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTruthy();

    const rotado = cookieValue(refreshed);
    expect(rotado).toBeTruthy();
    expect(rotado).not.toBe(original);
  });

  it("invalidates the consumed token, so reuse is rejected (401)", async () => {
    const login = await request(app)
      .post("/api/login")
      .send({ email: CRED.email, password: CRED.password });
    const original = cookieValue(login);

    const first = await request(app)
      .post("/api/refresh")
      .set("Cookie", original);
    expect(first.status).toBe(200);

    const reuse = await request(app)
      .post("/api/refresh")
      .set("Cookie", original);
    expect(reuse.status).toBe(401);
  });

  it("the rotated cookie is itself usable, and chains", async () => {
    const login = await request(app)
      .post("/api/login")
      .send({ email: CRED.email, password: CRED.password });

    let cookie = cookieValue(login);
    for (let i = 0; i < 3; i += 1) {
      const res = await request(app).post("/api/refresh").set("Cookie", cookie);
      expect(res.status).toBe(200);
      cookie = cookieValue(res);
      expect(cookie).toBeTruthy();
    }
  });

  it("rejects a token that is not a valid JWT (401)", async () => {
    const res = await request(app)
      .post("/api/refresh")
      .set("Cookie", "refreshToken=basura-no-es-un-jwt");
    expect(res.status).toBe(401);
  });

  it("rejects a correctly signed but expired token (401)", async () => {
    const user = await User.findOne({ email: CRED.email }).select("+refreshTokens");
    const expired = jwt.sign(
      { id: user._id, email: user.email, jti: "expired" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "-1s" },
    );
    // Se lo guarda en la base para probar que la expiración se comprueba
    // aparte del lookup.
    user.refreshTokens.push(expired);
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post("/api/refresh")
      .set("Cookie", `refreshToken=${expired}`);
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret (401)", async () => {
    const user = await User.findOne({ email: CRED.email }).select("+refreshTokens");
    const foreign = jwt.sign(
      { id: user._id, email: user.email, jti: "forged" },
      "secreto-que-no-es-el-del-sistema",
      { expiresIn: "10d" },
    );
    user.refreshTokens.push(foreign);
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post("/api/refresh")
      .set("Cookie", `refreshToken=${foreign}`);
    expect(res.status).toBe(401);
  });
});

describe("refresh tokens are capped", () => {
  it("keeps at most the 5 most recent tokens across many logins", async () => {
    const email = "muchoslogins@test.com";
    await request(app)
      .post("/api/register")
      .send({ name: "Muchos", email, password: "12345678" });

    for (let i = 0; i < 8; i += 1) {
      const res = await request(app)
        .post("/api/login")
        .send({ email, password: "12345678" });
      expect(res.status).toBe(200);
    }

    expect(await countTokens(email)).toBe(MAX_REFRESH_TOKENS);
  });

  it("concurrent logins in the same second still store distinct tokens", async () => {
    // Sin un identificador único por token, dos emissions en el mismo segundo
    // generan strings idénticos y la rotación borraría el token nuevo.
    const email = "mismosegundo@test.com";
    await request(app)
      .post("/api/register")
      .send({ name: "Mismo", email, password: "12345678" });

    const logins = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(app)
          .post("/api/login")
          .send({ email, password: "12345678" }),
      ),
    );

    const tokens = logins.map(cookieValue);
    expect(new Set(tokens).size).toBe(3);

    // Y cada uno rota por separado.
    const refrescos = await Promise.all(
      tokens.map((cookie) =>
        request(app).post("/api/refresh").set("Cookie", cookie),
      ),
    );
    for (const r of refrescos) expect(r.status).toBe(200);
  });
});

describe("logout revokes", () => {
  it("the refresh token stops working after logout (401)", async () => {
    const email = "logout@test.com";
    await request(app)
      .post("/api/register")
      .send({ name: "Logout", email, password: "12345678" });

    const login = await request(app)
      .post("/api/login")
      .send({ email, password: "12345678" });
    const cookie = cookieValue(login);

    const before = await request(app)
      .post("/api/refresh")
      .set("Cookie", cookie);
    expect(before.status).toBe(200);

    const rotado = cookieValue(before);

    const out = await request(app)
      .post("/api/logout")
      .set("Authorization", `Bearer ${before.body.accessToken}`)
      .set("Cookie", rotado);
    expect(out.status).toBe(200);

    const after = await request(app)
      .post("/api/refresh")
      .set("Cookie", rotado);
    expect(after.status).toBe(401);
  });
});
