import Machine from "../models/machine.model.js";
import MachineDocument from "../models/machineDocument.model.js";
import MachineImage from "../models/machineImage.model.js";
import MachineTask from "../models/machineTask.model.js";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import TaskLog from "../models/Tasklog.model.js";
import ApiError from "../utils/ApiError.js";
import {
  getAccessibleMachine,
  isValidObjectId,
  requireWorkshop,
} from "../utils/access.js";
import { getPagination } from "../utils/pagination.js";

function buildAccessFilter(user) {
  if (user?.role === "admin") return {};
  return { workshopId: user.workshop };
}

export async function createMachine(payload, user) {
  const workshopId = requireWorkshop(user);

  const machineData = {
    ...payload,
    workshopId,
    userId: user.id,
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
      .populate("workshopId", "name")
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
  const machine = await getAccessibleMachine(id, user);

  return machine.populate([
    { path: "workshopId", select: "name" },
    { path: "userId", select: "name email role" },
  ]);
}

export async function updateMachine(id, payload, user) {
  const workshopId = requireWorkshop(user);
  const machine = await getAccessibleMachine(id, user);

  if (payload.serialNumber !== undefined) machine.serialNumber = payload.serialNumber;
  if (payload.name !== undefined) machine.name = payload.name;
  if (payload.brand !== undefined) machine.brand = payload.brand;
  if (payload.model !== undefined) machine.model = payload.model;
  if (payload.description !== undefined) machine.description = payload.description;
  if (payload.status !== undefined) machine.status = payload.status;

  try {
    await machine.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "Serial number already exists in this workshop");
    }
    throw error;
  }

  return machine;
}

export async function changeMachineStatus(id, status, user) {
  if (!["active", "inactive", "maintenance"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const machine = await getAccessibleMachine(id, user);
  machine.status = status;
  await machine.save();

  return machine;
}

export async function deleteMachine(id, user) {
  const machine = await getAccessibleMachine(id, user);

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
