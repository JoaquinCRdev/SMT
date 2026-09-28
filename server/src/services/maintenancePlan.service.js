import MachineTask from "../models/machineTask.model.js";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import { createRecord } from "./maintenanceRecord.service.js";
import ApiError from "../utils/ApiError.js";
import {
  assertAssignableUser,
  getAccessibleMachine,
  getWorkshopMachineIds,
  isValidObjectId,
  requireWorkshop,
} from "../utils/access.js";
import { getPagination } from "../utils/pagination.js";

const FREQUENCY_DAYS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

function frequencyToDays(frequency, customDays) {
  if (frequency === "custom") return customDays;
  return FREQUENCY_DAYS[frequency];
}

function calculateNextDue(fromDate, frequency, customDays) {
  const days = frequencyToDays(frequency, customDays);
  const date = new Date(fromDate);
  date.setDate(date.getDate() + days);
  return date;
}

async function getAccessiblePlan(planId, user) {
  if (!isValidObjectId(planId)) throw new ApiError(400, "Invalid plan id");

  const plan = await MaintenancePlan.findById(planId);
  if (!plan) throw new ApiError(404, "Maintenance plan not found");

  await getAccessibleMachine(plan.machineId, user);

  return plan;
}

export async function createMaintenancePlan(machineId, payload, user) {
  const machine = await getAccessibleMachine(machineId, user);

  const startDate = new Date(payload.startDate);

  if (payload.frequency === "custom" && !payload.customDays) {
    throw new ApiError(400, "customDays is required when frequency is custom");
  }

  const assignees = [
    ...(payload.assignedTo ?? []),
    ...(payload.tasks ?? []).map((t) => t.assignedTo).filter(Boolean),
  ];
  for (const assignee of assignees) {
    await assertAssignableUser(assignee, user);
  }

  let taskIds = [];
  if (payload.tasks?.length) {
    const taskDocs = payload.tasks.map((t) => ({
      machineId: machine._id,
      title: t.title,
      description: t.description,
      priority: t.priority || "medium",
      status: "pending",
      assignedTo: t.assignedTo,
    }));
    const createdTasks = await MachineTask.create(taskDocs);
    taskIds = createdTasks.map((t) => t._id);
  }

  const plan = await MaintenancePlan.create({
    machineId: machine._id,
    title: payload.title,
    description: payload.description,
    frequency: payload.frequency,
    customDays: payload.customDays,
    tasks: taskIds,
    assignedTo: payload.assignedTo ?? [],
    startDate,
    endDate: payload.endDate ? new Date(payload.endDate) : undefined,
    nextDue: calculateNextDue(startDate, payload.frequency, payload.customDays),
    notes: payload.notes,
    userId: user.id,
  });

  return plan.populate(["tasks", "assignedTo", "userId"]);
}

export async function getPlansByMachine(machineId, user, query = {}) {
  await getAccessibleMachine(machineId, user);

  const filter = { machineId };

  if (query.status) filter.status = query.status;
  if (query.frequency) filter.frequency = query.frequency;

  const { page, limit, skip } = getPagination(query);

  const [items, total] = await Promise.all([
    MaintenancePlan.find(filter)
      .sort({ nextDue: 1 })
      .skip(skip)
      .limit(limit)
      .populate("tasks")
      .populate("assignedTo", "name email role")
      .populate("userId", "name email"),
    MaintenancePlan.countDocuments(filter),
  ]);

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function getAllPlans(user, query = {}) {
  const { page, limit, skip } = getPagination(query);

  const workshopId = requireWorkshop(user);
  const workshopMachines = await getWorkshopMachineIds(workshopId);
  const filter = { machineId: { $in: workshopMachines } };

  if (query.machineId) {
    const isOwnMachine = workshopMachines.some(
      (m) => String(m) === String(query.machineId),
    );

    if (!isOwnMachine) {
      return { items: [], meta: { total: 0, page, limit, pages: 0 } };
    }

    filter.machineId = query.machineId;
  }

  if (query.status) filter.status = query.status;
  if (query.frequency) filter.frequency = query.frequency;

  const [items, total] = await Promise.all([
    MaintenancePlan.find(filter)
      .sort({ nextDue: 1 })
      .skip(skip)
      .limit(limit)
      .populate("machineId", "name brand model serialNumber tipo status")
      .populate("tasks")
      .populate("assignedTo", "name email role")
      .populate("userId", "name email"),
    MaintenancePlan.countDocuments(filter),
  ]);

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function getPlanById(machineId, planId, user) {
  await getAccessibleMachine(machineId, user);
  const plan = await getAccessiblePlan(planId, user);

  return plan.populate(["tasks", "assignedTo", "userId"]);
}

export async function updatePlan(machineId, planId, payload, user) {
  await getAccessibleMachine(machineId, user);
  const plan = await getAccessiblePlan(planId, user);

  if (
    payload.frequency === "custom" &&
    !payload.customDays &&
    !plan.customDays
  ) {
    throw new ApiError(400, "customDays is required when frequency is custom");
  }

  if (payload.assignedTo) {
    for (const assignee of payload.assignedTo) {
      await assertAssignableUser(assignee, user);
    }
    plan.assignedTo = payload.assignedTo;
  }

  if (payload.tasks) {
    const taskAssignees = payload.tasks.map((t) => t.assignedTo).filter(Boolean);
    for (const assignee of taskAssignees) {
      await assertAssignableUser(assignee, user);
    }

    const taskDocs = payload.tasks.map((t) => ({
      machineId: plan.machineId,
      title: t.title,
      description: t.description,
      priority: t.priority || "medium",
      status: "pending",
      assignedTo: t.assignedTo,
    }));
    const createdTasks = await MachineTask.create(taskDocs);
    plan.tasks = plan.tasks.concat(createdTasks.map((t) => t._id));
  }

  if (payload.title !== undefined) plan.title = payload.title;
  if (payload.description !== undefined) plan.description = payload.description;
  if (payload.frequency !== undefined) plan.frequency = payload.frequency;
  if (payload.customDays !== undefined) plan.customDays = payload.customDays;
  if (payload.startDate !== undefined)
    plan.startDate = new Date(payload.startDate);
  if (payload.endDate !== undefined) plan.endDate = new Date(payload.endDate);
  if (payload.notes !== undefined) plan.notes = payload.notes;
  if (payload.status !== undefined) plan.status = payload.status;

  if (payload.frequency || payload.customDays || payload.startDate) {
    const base = payload.startDate
      ? new Date(payload.startDate)
      : plan.lastPerformed || plan.startDate;
    plan.nextDue = calculateNextDue(
      base,
      payload.frequency || plan.frequency,
      payload.customDays || plan.customDays,
    );
  }

  await plan.save();
  return plan.populate(["tasks", "assignedTo", "userId"]);
}

export async function changePlanStatus(machineId, planId, status, user) {
  await getAccessibleMachine(machineId, user);
  const plan = await getAccessiblePlan(planId, user);

  if (status !== "active" && status !== "inactive") {
    throw new ApiError(400, "Invalid status");
  }

  plan.status = status;
  await plan.save();

  return plan.populate(["tasks", "assignedTo", "userId"]);
}

export async function deletePlan(machineId, planId, user) {
  await getAccessibleMachine(machineId, user);
  const plan = await getAccessiblePlan(planId, user);

  if (plan.tasks?.length) {
    await MachineTask.deleteMany({ _id: { $in: plan.tasks } });
  }

  await MaintenancePlan.findByIdAndDelete(plan._id);

  return { message: "Maintenance plan deleted" };
}

export async function markPlanPerformed(machineId, planId, user, payload = {}) {
  await getAccessibleMachine(machineId, user);
  const plan = await getAccessiblePlan(planId, user);

  const performedAt = payload.performedAt
    ? new Date(payload.performedAt)
    : new Date();

  plan.lastPerformed = performedAt;
  plan.nextDue = calculateNextDue(performedAt, plan.frequency, plan.customDays);

  if (payload.notes && plan.notes) {
    plan.notes += `\n[${performedAt.toISOString()}] ${payload.notes}`;
  } else if (payload.notes) {
    plan.notes = `[${performedAt.toISOString()}] ${payload.notes}`;
  }

  await plan.save();

  // Dar por realizado el plan cierra sus tareas pendientes: si el usuario
  // marca el mantenimiento como hecho, el plan no puede quedar con trabajo
  // sin terminar colgando.
  const planConTareas = await plan.populate("tasks");
  const pendientes = planConTareas.tasks.filter((t) => t.status !== "done");

  if (pendientes.length) {
    await MachineTask.updateMany(
      { _id: { $in: pendientes.map((t) => t._id) } },
      { $set: { status: "done", updatedAt: new Date() } },
    );
  }

  // Y deja el rastro en el historial: antes marcar un plan como realizado no
  // generaba ningún MaintenanceRecord, así que /historial nunca lo mostraba.
  await createRecord(
    {
      machineId: plan.machineId,
      planId: plan._id,
      title: plan.title,
      performedAt,
      notes: payload.notes,
    },
    user,
  );

  return plan.populate(["tasks", "assignedTo", "userId"]);
}
