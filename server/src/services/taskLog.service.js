import TaskLog from "../models/Tasklog.model.js";
import ApiError from "../utils/ApiError.js";
import {
  getAccessibleMachine,
  isValidObjectId,
} from "../utils/access.js";

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
