import mongoose from "mongoose";
import Machine from "../models/machine.model.js";
import MachineTask from "../models/machineTask.model.js";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import ApiError from "../utils/ApiError.js";

const FREQUENCY_DAYS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

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

async function getAccessibleMachine(machineId, user) {
  if (!isValidObjectId(machineId))
    throw new ApiError(400, "Invalid machine id");

  const machine = await Machine.findById(machineId);
  if (!machine) throw new ApiError(404, "Machine not found");

  if (user?.role !== "admin" && String(machine.userId) !== String(user.id)) {
    throw new ApiError(403, "Forbidden");
  }

  return machine;
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
    startDate,
    endDate: payload.endDate ? new Date(payload.endDate) : undefined,
    nextDue: calculateNextDue(startDate, payload.frequency, payload.customDays),
    notes: payload.notes,
    userId: user.id,
  });

  return plan.populate(["tasks", "userId"]);
}

export async function getPlansByMachine(machineId, user, query = {}) {
  await getAccessibleMachine(machineId, user);

  const filter = { machineId };

  if (query.status) filter.status = query.status;
  if (query.frequency) filter.frequency = query.frequency;

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MaintenancePlan.find(filter)
      .sort({ nextDue: 1 })
      .skip(skip)
      .limit(limit)
      .populate("tasks")
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

  return plan.populate(["tasks", "userId"]);
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

  if (payload.tasks) {
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
  return plan.populate(["tasks", "userId"]);
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
  return plan.populate(["tasks", "userId"]);
}
