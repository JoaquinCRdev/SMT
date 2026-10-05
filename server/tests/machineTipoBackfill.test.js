import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { app } from "./setup.js";
import Machine from "../src/models/machine.model.js";
import MaintenancePlan from "../src/models/maintenancePlan.model.js";

const auth = (t) => ["Authorization", `Bearer ${t}`];

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

// Réplica de la lógica del script de migración, para poder testearla sin abrir
// una conexión real contra la base.
const sinTipo = {
  $or: [{ tipo: { $exists: false } }, { tipo: null }],
};

async function migrar() {
  const r = await Machine.updateMany(sinTipo, { $set: { tipo: "maquina" } });
  return r.modifiedCount;
}

// Reproduce `distribuir` de mismaquinas.jsx y `tipoDe` de mantenimiento.jsx,
// que son el código que decide si un equipo se ve o se pierde.
const tipoDe = (machine) => (machine?.tipo === "otro" ? "otro" : "maquina");

function distribuir(items) {
  return {
    maquinas: items.filter((i) => tipoDe(i) !== "otro"),
    otros: items.filter((i) => tipoDe(i) === "otro"),
  };
}

describe("backfill de Machine.tipo", () => {
  let owner;
  let vieja;
  let normal;
  let otro;

  beforeAll(async () => {
    owner = await register("tipoOwner@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(owner))
      .send({ name: "Taller Tipo" });

    const crear = async (nombre, tipo, serial) => {
      const body = {
        name: nombre,
        brand: "Marca",
        model: "Modelo",
        serialNumber: serial,
      };
      if (tipo) body.tipo = tipo;
      const r = await request(app).post("/api/machine").set(...auth(owner)).send(body);
      expect(r.status).toBe(201);
      return r.body._id;
    };

    normal = await crear("Equipo normal de prueba", "maquina", "TIPO-0001");
    otro = await crear("Equipo de otros de prueba", "otro", "TIPO-0002");

    // La API valida `tipo` como required, así que para simular una máquina vieja
    // hay que insertarla directo en la base, saltando el validator.
    vieja = new Machine({
      name: "Equipo viejo sin tipo de prueba",
      brand: "Marca",
      model: "Modelo",
      serialNumber: "TIPO-0003",
      workshopId: (await Machine.findById(normal)).workshopId,
      userId: (await Machine.findById(normal)).userId,
    });
    await vieja.save({ validateBeforeSave: false });
  });

  it("el fixture previo reproduce el problema: la vieja no cae en ningún bucket", () => {
    const items = [
      { name: "normal", tipo: "maquina" },
      { name: "vieja", tipo: undefined },
      { name: "otro", tipo: "otro" },
    ];

    // Con el criterio viejo (== "maquina" y == "otro") la vieja se perdía.
    const antes = {
      maquinas: items.filter((i) => i.tipo === "maquina"),
      otros: items.filter((i) => i.tipo === "otro"),
    };
    expect(antes.maquinas.map((i) => i.name)).toEqual(["normal"]);
    expect(antes.maquinas).not.toContainEqual(
      expect.objectContaining({ name: "vieja" }),
    );

    // Con el criterio nuevo aparece en "maquinas" y no se duplica en "otros".
    const despues = distribuir(items);
    expect(despues.maquinas.map((i) => i.name)).toEqual(["normal", "vieja"]);
    expect(despues.otros.map((i) => i.name)).toEqual(["otro"]);
  });

  it("la máquina vieja existe sin tipo en la base", async () => {
    const doc = await Machine.findById(vieja).lean();
    expect(doc.tipo).toBeFalsy();
  });

  it("el backfill le pone tipo maquina y no toca las demás", async () => {
    const count = await migrar();
    expect(count).toBeGreaterThanOrEqual(1);

    const v = await Machine.findById(vieja).lean();
    const n = await Machine.findById(normal).lean();
    const o = await Machine.findById(otro).lean();

    expect(v.tipo).toBe("maquina");
    expect(n.tipo).toBe("maquina");
    expect(o.tipo).toBe("otro");
  });

  it("no quedan máquinas sin tipo", async () => {
    expect(await Machine.countDocuments(sinTipo)).toBe(0);
  });

  it("es idempotente: una segunda pasada no modifica nada", async () => {
    expect(await migrar()).toBe(0);
  });

  it("un plan sobre un equipo de tipo 'otro' vuelve con machineId.tipo", async () => {
    const plan = await request(app)
      .post(`/api/machine/${otro}/plans`)
      .set(...auth(owner))
      .send({
        title: "Plan sobre un elemento de otros",
        frequency: "daily",
        startDate: iso(new Date()),
        tasks: [{ title: "Revisar el estado" }],
      });
    expect(plan.status).toBe(201);

    // El cliente separa las tabs leyendo esto: sin `tipo` en el populate, la
    // tab Otros no podría filtrar.
    const listado = await request(app)
      .get("/api/plans")
      .set(...auth(owner))
      .query({ limit: 100 });

    const encontrado = listado.body.items.find(
      (p) => String(p._id) === String(plan.body._id),
    );
    expect(encontrado).toBeTruthy();
    expect(encontrado.machineId.tipo).toBe("otro");
  });

  it("el plan de un equipo 'otro' cae en la tab Otros y no en Máquinas", () => {
    const planes = [
      { title: "p1", machineId: { tipo: "maquina" } },
      { title: "p2", machineId: { tipo: "otro" } },
    ];

    const deTab = (t) => planes.filter((p) => tipoDe(p.machineId) === t);

    expect(deTab("maquina").map((p) => p.title)).toEqual(["p1"]);
    expect(deTab("otro").map((p) => p.title)).toEqual(["p2"]);
  });

  it("un plan cuya máquina perdió el tipo no desaparece de la tab", () => {
    // `machineId` es required en el schema, pero si el documento de la máquina
    // quedara sin tipo el plan tiene que seguir siendo visible en algún lado.
    const planes = [{ title: "p1", machineId: { tipo: undefined } }];
    const deTab = (t) => planes.filter((p) => tipoDe(p.machineId) === t);
    expect(deTab("maquina")).toHaveLength(1);
    expect(deTab("otro")).toHaveLength(0);
  });

  it("no se puede colgar un plan de una máquina de otro taller", async () => {
    const otroOwner = await register("tipoOwner2@test.com");
    await request(app)
      .post("/api/workshops")
      .set(...auth(otroOwner))
      .send({ name: "Taller Ajeno" });

    const res = await request(app)
      .post(`/api/machine/${otro}/plans`)
      .set(...auth(otroOwner))
      .send({
        title: "Intento de plan ajeno",
        frequency: "daily",
        startDate: iso(new Date()),
        tasks: [{ title: "No debería poder" }],
      });

    expect(res.status).not.toBe(201);
    expect(await MaintenancePlan.countDocuments({ title: "Intento de plan ajeno" })).toBe(0);
  });
});