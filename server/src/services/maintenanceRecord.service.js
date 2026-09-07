import Machine from "../models/machine.model.js";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import MaintenanceRecord from "../models/maintenanceRecord.model.js";
import ApiError from "../utils/ApiError.js";
import {
  getAccessibleMachine,
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

function calculateNextDue(fromDate, frequency, customDays) {
  const days = frequency === "custom" ? customDays : FREQUENCY_DAYS[frequency];
  const date = new Date(fromDate);
  date.setDate(date.getDate() + days);
  return date;
}

export async function createRecord(payload, user) {
  const machine = await getAccessibleMachine(payload.machineId, user);
  requireWorkshop(user);

  if (payload.planId) {
    if (!isValidObjectId(payload.planId))
      throw new ApiError(400, "Invalid plan id");
    const plan = await MaintenancePlan.findById(payload.planId);
    if (!plan) throw new ApiError(404, "Maintenance plan not found");
    if (String(plan.machineId) !== String(machine._id))
      throw new ApiError(400, "Plan does not belong to this machine");
  }

  const record = await MaintenanceRecord.create({
    machineId: machine._id,
    planId: payload.planId,
    title: payload.title,
    description: payload.description,
    performedAt: new Date(payload.performedAt),
    duration: payload.duration,
    cost: payload.cost,
    partsUsed: payload.partsUsed,
    technician: payload.technician,
    results: payload.results,
    notes: payload.notes,
    userId: user.id,
  });

  if (payload.planId) {
    const plan = await MaintenancePlan.findById(payload.planId);
    plan.lastPerformed = record.performedAt;
    plan.nextDue = calculateNextDue(
      record.performedAt,
      plan.frequency,
      plan.customDays,
    );
    await plan.save();
  }

  return record.populate(["machineId", "planId", "userId"]);
}

export async function getRecords(user, query = {}) {
  const { page, limit, skip } = getPagination(query);

  const filter = {};

  if (user?.role !== "admin") {
    const machines = await Machine.find({ workshopId: user.workshop }).select(
      "_id",
    );
    const machineIds = machines.map((m) => m._id);
    filter.machineId = { $in: machineIds };
  }
  if (query.machineId) filter.machineId = query.machineId;

  const [items, total] = await Promise.all([
    MaintenanceRecord.find(filter)
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("machineId", "name brand model serialNumber")
      .populate("planId", "title frequency")
      .populate("userId", "name email"),
    MaintenanceRecord.countDocuments(filter),
  ]);

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function getRecordsByMachine(machineId, user, query = {}) {
  await getAccessibleMachine(machineId, user);

  const { page, limit, skip } = getPagination(query);

  const [items, total] = await Promise.all([
    MaintenanceRecord.find({ machineId })
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("planId", "title frequency")
      .populate("userId", "name email"),
    MaintenanceRecord.countDocuments({ machineId }),
  ]);

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}
