import mongoose from "mongoose";
import Machine from "../models/machine.model.js";
import User from "../models/user.model.js";
import ApiError from "./ApiError.js";

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export function requireWorkshop(user) {
  if (!user.workshop) {
    throw new ApiError(403, "You do not belong to a workshop");
  }
  return user.workshop;
}

export async function getWorkshopMachineIds(workshopId) {
  const machines = await Machine.find({ workshopId }).select("_id");
  return machines.map((m) => m._id);
}

export async function assertAssignableUser(assignedTo, user) {
  if (!isValidObjectId(assignedTo)) {
    throw new ApiError(400, "Invalid user id");
  }
  const workshopId = requireWorkshop(user);
  const target = await User.findById(assignedTo).select("workshop");
  if (!target || String(target.workshop) !== String(workshopId)) {
    throw new ApiError(400, "User is not a member of this workshop");
  }
  return target;
}

export async function getAccessibleMachine(machineId, user) {
  if (!isValidObjectId(machineId))
    throw new ApiError(400, "Invalid machine id");

  const machine = await Machine.findById(machineId);
  if (!machine) throw new ApiError(404, "Machine not found");

  if (String(machine.workshopId) !== String(user.workshop)) {
    throw new ApiError(403, "Forbidden");
  }

  return machine;
}