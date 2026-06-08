import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import Machine from "../models/Machine.js";
import MachineTask from "../models/MachineTask.js";
import TaskLog from "../models/TaskLog.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getAccessibleMachine(machineId, user) {
  if (!isValidObjectId(machineId)) throw new AppError("Invalid machine id", 400);

  const machine = await Machine.findById(machineId);
  if (!machine) throw new AppError("Machine not found", 404);

  if (user?.role !== "admin" && String(machine.userId) !== String(user.id)) {
    throw new AppError("Forbidden", 403);
  }

  return machine;
}

async function getAccessibleTask(taskId, user) {
  if (!isValidObjectId(taskId)) throw new AppError("Invalid task id", 400);

  const task = await MachineTask.findById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  await getAccessibleMachine(task.machineId, user);

  return task;
}

async function createTaskLog({ machineId, taskId, userId, action, notes }) {
  return TaskLog.create({
    machineId,
    taskId,
    userId,
    action,
    notes,
  });
}

export async function createTask(machineId, payload, user) {
  const machine = await getAccessibleMachine(machineId, user);

  const task = await MachineTask.create({
    machineId: machine._id,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    assignedTo: payload.assignedTo,
  });

  await createTaskLog({
    machineId: machine._id,
    taskId: task._id,
    userId: user.id,
    action: "created",
    notes: `Task "${task.title}" created`,
  });

  return task;
}

export async function getTasksByMachine(machineId, user, query = {}) {
  await getAccessibleMachine(machineId, user);

  const filter = { machineId };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  const tasks = await MachineTask.find(filter)
    .sort({ createdAt: -1 })
    .populate("assignedTo", "name email role");

  return tasks;
}

export async function getTaskById(id, user) {
  const task = await getAccessibleTask(id, user);
  return task.populate("assignedTo", "name email role");
}

export async function updateTask(id, payload, user) {
  const task = await getAccessibleTask(id, user);

  if (payload.title !== undefined) task.title = payload.title;
  if (payload.description !== undefined) task.description = payload.description;
  if (payload.priority !== undefined) task.priority = payload.priority;
  if (payload.status !== undefined) task.status = payload.status;
  if (payload.assignedTo !== undefined) task.assignedTo = payload.assignedTo;

  await task.save();

  await createTaskLog({
    machineId: task.machineId,
    taskId: task._id,
    userId: user.id,
    action: "updated",
    notes: `Task "${task.title}" updated`,
  });

  return task;
}

export async function changeTaskStatus(id, status, user) {
  if (!["pending", "in_progress", "done"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const task = await getAccessibleTask(id, user);
  const previousStatus = task.status;

  task.status = status;
  await task.save();

  const action = previousStatus === "done" && status !== "done" ? "reopened" : "updated";

  await createTaskLog({
    machineId: task.machineId,
    taskId: task._id,
    userId: user.id,
    action,
    notes: `Task status changed from ${previousStatus} to ${status}`,
  });

  return task;
}

export async function assignTaskToUser(id, assignedTo, user) {
  const task = await getAccessibleTask(id, user);

  task.assignedTo = assignedTo;
  await task.save();

  await createTaskLog({
    machineId: task.machineId,
    taskId: task._id,
    userId: user.id,
    action: "updated",
    notes: `Task assigned to ${assignedTo || "unassigned"}`,
  });

  return task;
}

export async function deleteTask(id, user) {
  const task = await getAccessibleTask(id, user);

  await createTaskLog({
    machineId: task.machineId,
    taskId: task._id,
    userId: user.id,
    action: "deleted",
    notes: `Task "${task.title}" deleted`,
  });

  await MachineTask.findByIdAndDelete(task._id);

  return { message: "Task deleted" };
}