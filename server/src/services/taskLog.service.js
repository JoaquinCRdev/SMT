import mongoose from "mongoose";
import Machine from "../models/machine.model.js";
import TaskLog from "../models/taskLog.model.js";
import ApiError from "../utils/ApiError.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
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

export async function getTaskLogsByMachine(machineId, user) {
  await getAccessibleMachine(machineId, user);

  return TaskLog.find({ machineId })
    .sort({ createdAt: -1 })
    .populate("userId", "name email role")
    .populate("taskId", "title status priority");
}

export async function getTaskLogsByTask(taskId, user) {
  if (!isValidObjectId(taskId)) throw new ApiError(400, "Invalid task id");

  const logs = await TaskLog.find({ taskId })
    .sort({ createdAt: -1 })
    .populate("userId", "name email role")
    .populate("taskId", "title status priority");

  if (!logs.length) return [];

  await getAccessibleMachine(logs[0].machineId, user);

  return logs;
}

export async function getTaskLogsByUser(userId, user) {
  if (user?.role !== "admin" && String(user.id) !== String(userId)) {
    throw new ApiError(403, "Forbidden");
  }

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");

  return TaskLog.find({ userId })
    .sort({ createdAt: -1 })
    .populate("machineId", "name brand model")
    .populate("taskId", "title status priority");
}
