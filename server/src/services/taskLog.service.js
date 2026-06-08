import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import Machine from "../models/machine.model.js";
import TaskLog from "../models/taskLog.model.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getAccessibleMachine(machineId, user) {
  if (!isValidObjectId(machineId)) throw new ApiError("Invalid machine id", 400);

  const machine = await Machine.findById(machineId);
  if (!machine) throw new ApiError("Machine not found", 404);

  if (user?.role !== "admin" && String(machine.userId) !== String(user.id)) {
    throw new ApiError("Forbidden", 403);
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
  if (!isValidObjectId(taskId)) throw new ApiError("Invalid task id", 400);

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
    throw new ApiError("Forbidden", 403);
  }

  if (!isValidObjectId(userId)) throw new ApiError("Invalid user id", 400);

  return TaskLog.find({ userId })
    .sort({ createdAt: -1 })
    .populate("machineId", "name brand model")
    .populate("taskId", "title status priority");
}