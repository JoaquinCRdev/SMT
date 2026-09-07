import mongoose from "mongoose";
import Machine from "../models/machine.model.js";
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

export async function getAccessibleMachine(machineId, user) {
  if (!isValidObjectId(machineId))
    throw new ApiError(400, "Invalid machine id");

  const machine = await Machine.findById(machineId);
  if (!machine) throw new ApiError(404, "Machine not found");

  if (user?.role !== "admin" && String(machine.workshopId) !== String(user.workshop)) {
    throw new ApiError(403, "Forbidden");
  }

  return machine;
}