import Machine from "../models/machine.model.js";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import MaintenanceRecord from "../models/maintenanceRecord.model.js";
import { getPagination } from "../utils/pagination.js";
import { requireWorkshop } from "../utils/access.js";
import { startOfToday } from "../utils/dates.js";

const DAY_MS = 86_400_000;

const MACHINE_PROJECTION = "name brand model serialNumber tipo status";

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
function escapeRegex(term) {
  return term.replace(ESCAPE_REGEX, "\\$&");
}

const ESTADO_LABELS = ["realizado", "pendiente", "vencido"];

function toDateOnly(value) {
  return value.toISOString().slice(0, 10);
}

function isPastDue(date, hoy) {
  return date && date < hoy;
}

// Une dos listas YA ordenadas en la misma dirección y devuelve la lista
// combinada, también en esa dirección. Al mezclar el top (skip + limit) de
// registros con la totalidad de los planes (pocos), la página que se obtiene
// es exacta a cualquier profundidad: cualquier elemento en posición i <= skip
// + limit aporta a lo sumo i registros, que ya están dentro del top consultado.
function mergeSorted(a, b, dir) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const da = a[i].fecha.getTime();
    const db = b[j].fecha.getTime();
    if (dir === 1 ? da <= db : da >= db) {
      out.push(a[i]);
      i += 1;
    } else {
      out.push(b[j]);
      j += 1;
    }
  }
  return out.concat(a.slice(i), b.slice(j));
}

function recordToView(record) {
  return {
    id: String(record._id),
    estado: "Realizado",
    fecha: record.performedAt,
    title: record.title,
    description: record.description || "",
    machine: record.machineId || null,
    plan: record.planId || null,
    source: "record",
    technician: record.technician || "",
    duration: record.duration ?? null,
    cost: record.cost ?? null,
    partsUsed: record.partsUsed || "",
    results: record.results || "",
    notes: record.notes || "",
    tasks: [],
    assignedTo: [],
  };
}

function planToView(plan, estado, fecha) {
  return {
    id: String(plan._id),
    estado,
    fecha,
    title: plan.title,
    description: plan.description || "",
    machine: plan.machineId || null,
    plan: { _id: String(plan._id), title: plan.title, frequency: plan.frequency },
    source: "plan",
    technician: "",
    duration: null,
    cost: null,
    partsUsed: "",
    results: "",
    notes: plan.notes || "",
    tasks: plan.tasks || [],
    assignedTo: plan.assignedTo || [],
  };
}

function serialize(item) {
  const machine = item.machine
    ? {
        _id: String(item.machine._id),
        name: item.machine.name,
        brand: item.machine.brand,
        model: item.machine.model,
        serialNumber: item.machine.serialNumber,
        tipo: item.machine.tipo,
        status: item.machine.status,
      }
    : null;
  return { ...item, fecha: toDateOnly(item.fecha), machine };
}

function emptyResult(page, limit, workshopMachines) {
  return {
    items: [],
    meta: { total: 0, page, limit, pages: 0 },
    counts: { realizado: 0, pendiente: 0, vencido: 0 },
    machines: workshopMachines,
  };
}

export async function getHistory(user, query = {}) {
  const { page, limit, skip } = getPagination(query, 100, 1000);
  const workshopId = requireWorkshop(user);

  const workshopMachines = await Machine.find({ workshopId })
    .select(MACHINE_PROJECTION)
    .lean();
  const workshopIds = workshopMachines.map((m) => m._id);

  if (
    query.machineId &&
    !workshopIds.some((id) => String(id) === String(query.machineId))
  ) {
    return emptyResult(page, limit, workshopMachines);
  }

  const dir = query.order === "antiguos" ? 1 : -1;
  const hoy = startOfToday();

  const rawDays =
    query.days && query.days !== "todos" ? parseInt(query.days, 10) : null;
  const minFecha =
    rawDays && !Number.isNaN(rawDays)
      ? new Date(Date.now() - rawDays * DAY_MS)
      : null;

  const termino = (query.search || "").trim();
  const regex = termino ? new RegExp(escapeRegex(termino), "i") : null;
  const searchedMachineIds = regex
    ? workshopMachines
        .filter((m) =>
          regex.test(`${m.name} ${m.brand} ${m.model} ${m.serialNumber}`),
        )
        .map((m) => m._id)
    : null;

  const rawState = query.state || "todos";
  const state = ESTADO_LABELS.includes(rawState) ? rawState : "todos";

  // --- Registros: fecha = performedAt, se filtran y ordenan en Mongo.
  const recordMatch = {
    machineId: { $in: workshopIds },
  };
  if (query.machineId) recordMatch.machineId = query.machineId;
  if (regex) {
    const or = [{ title: regex }, { description: regex }];
    if (searchedMachineIds.length) {
      or.push({ machineId: { $in: searchedMachineIds } });
    }
    recordMatch.$or = or;
  }
  if (minFecha) recordMatch.performedAt = { $gte: minFecha };

  const recordCount = await MaintenanceRecord.countDocuments(recordMatch);

  let records = [];
  const wantRecords = state === "todos" || state === "realizado";
  if (wantRecords) {
    const recordQuery = MaintenanceRecord.find(recordMatch)
      .sort({ performedAt: dir })
      .populate("machineId", MACHINE_PROJECTION)
      .populate("planId", "title frequency")
      .lean();

    // Con estado específico la paginación es directa; con "todos" se trae el
    // top (skip + limit) para poder intercalar los planes en la mezcla.
    records =
      state === "todos"
        ? await recordQuery.limit(skip + limit)
        : await recordQuery.skip(skip).limit(limit);
  }

  // --- Planes: pocos, se traen todos y se clasifican/filtran en JS.
  // Se cargan siempre, aunque `state` sea "realizado": los counts por estado
  // no pueden depender del filtro activo (el usuario cambia el estado y las
  // tres tarjetas se mantienen).
  const planMatch = { status: "active", machineId: { $in: workshopIds } };
  if (query.machineId) planMatch.machineId = query.machineId;

  const plans = await MaintenancePlan.find(planMatch)
    .populate("machineId", MACHINE_PROJECTION)
    .populate("tasks", "title description priority status")
    .populate("assignedTo", "name email")
    .lean();

  const planItems = plans
    .map((plan) => {
      const endDate = plan.endDate ? new Date(plan.endDate) : null;
      const nextDue = new Date(plan.nextDue);
      const endDatePassed = isPastDue(endDate, hoy);
      const estado = endDatePassed || nextDue < hoy ? "Vencido" : "Pendiente";
      const fecha = endDatePassed ? endDate : nextDue;
      return { plan, estado, fecha };
    })
    .filter(({ fecha }) => !minFecha || fecha >= minFecha)
    .filter(({ plan }) => {
      if (!regex) return true;
      const machine = plan.machineId;
      return (
        regex.test(plan.title) ||
        regex.test(plan.description || "") ||
        (machine &&
          regex.test(
            `${machine.name} ${machine.brand} ${machine.model} ${machine.serialNumber}`,
          ))
      );
    })
    .sort((a, b) => (dir === 1 ? a.fecha - b.fecha : b.fecha - a.fecha));

  const pendienteCount = planItems.filter((x) => x.estado === "Pendiente").length;
  const vencidoCount = planItems.filter((x) => x.estado === "Vencido").length;

  const planForView =
    state === "todos"
      ? planItems
      : state === "realizado"
        ? []
        : planItems.filter((x) => x.estado === estadoLabel(state));
  const planViews = planForView.map((x) =>
    planToView(x.plan, x.estado, x.fecha),
  );
  const recordViews = records.map(recordToView);

  // ---- Vista final
  const merged =
    state === "todos"
      ? mergeSorted(recordViews, planViews, dir)
      : state === "realizado"
        ? recordViews
        : planViews;

  const total =
    state === "todos"
      ? recordCount + planItems.length
      : state === "realizado"
        ? recordCount
        : state === "pendiente"
          ? pendienteCount
          : vencidoCount;

  // `realizado` ya viene paginado desde Mongo (skip/limit); los otros estados
  // se paginan acá porque se traen todos los planes.
  const items =
    state === "realizado"
      ? merged.map(serialize)
      : merged.slice(skip, skip + limit).map(serialize);

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    counts: {
      realizado: recordCount,
      pendiente: pendienteCount,
      vencido: vencidoCount,
    },
    machines: workshopMachines,
  };
}

function estadoLabel(state) {
  return state === "pendiente" ? "Pendiente" : "Vencido";
}