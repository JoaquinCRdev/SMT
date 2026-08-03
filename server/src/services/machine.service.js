import mongoose from "mongoose";
import Machine from "../models/machine.model.js";
import MachineDocument from "../models/machineDocument.model.js";
import MachineImage from "../models/machineImage.model.js";
import MachineTask from "../models/machineTask.model.js";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import TaskLog from "../models/Tasklog.model.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function buildAccessFilter(user) {
  if (user?.role === "admin") return {};
  return { userId: user.id };
}

export async function createMachine(payload, user) {
  const machineData = {
    ...payload,
    userId: user?.role === "admin" && payload.userId ? payload.userId : user.id,
  };

  const machine = await Machine.create(machineData);
  return machine;
}

export async function getMachines(user, query = {}) {
  const { page, limit, skip } = getPagination(query);

  const filter = buildAccessFilter(user);

  if (query.status) {
    filter.status = query.status;
  }

  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: "i" } },
      { brand: { $regex: query.q, $options: "i" } },
      { model: { $regex: query.q, $options: "i" } },
      { serialNumber: { $regex: query.q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Machine.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email role"),
    Machine.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getMachineById(id, user) {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid machine id");
  }

  const machine = await Machine.findById(id).populate(
    "userId",
    "name email role",
  );
  if (!machine) throw new ApiError(404, "Machine not found");

  if (
    user?.role !== "admin" &&
    String(machine.userId?._id || machine.userId) !== String(user.id)
  ) {
    throw new ApiError(403, "Forbidden");
  }

  return machine;
}

export async function updateMachine(id, payload, user) {
  const machine = await getMachineById(id, user);

  Object.assign(machine, payload);

  try {
    await machine.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "Serial number already exists");
    }
    throw error;
  }

  return machine;
}

export async function changeMachineStatus(id, status, user) {
  if (!["active", "inactive", "maintenance"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const machine = await getMachineById(id, user);
  machine.status = status;
  await machine.save();

  return machine;
}

export async function deleteMachine(id, user) {
  const machine = await getMachineById(id, user);

  await Promise.all([
    MachineImage.deleteMany({ machineId: machine._id }),
    MachineDocument.deleteMany({ machineId: machine._id }),
    MachineTask.deleteMany({ machineId: machine._id }),
    TaskLog.deleteMany({ machineId: machine._id }),
    MaintenancePlan.deleteMany({ machineId: machine._id }),
    Machine.findByIdAndDelete(machine._id),
  ]);

  return { message: "Machine deleted" };
}

export async function getMyMachines(user, query = {}) {
  return getMachines(user, query);
}
