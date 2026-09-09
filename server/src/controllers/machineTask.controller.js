import * as machineTaskService from "../services/machineTask.service.js";

export async function createTask(req, res, next) {
  try {
    const task = await machineTaskService.createTask(
      req.params.machineId,
      req.body,
      req.user,
    );
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

export async function getTasksByMachine(req, res, next) {
  try {
    const tasks = await machineTaskService.getTasksByMachine(
      req.params.machineId,
      req.user,
      req.query,
    );
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const task = await machineTaskService.getTaskById(
      req.params.id,
      req.user,
    );
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await machineTaskService.updateTask(
      req.params.id,
      req.body,
      req.user,
    );
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

export async function changeTaskStatus(req, res, next) {
  try {
    const task = await machineTaskService.changeTaskStatus(
      req.params.id,
      req.body.status,
      req.user,
    );
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

export async function assignTaskToUser(req, res, next) {
  try {
    const task = await machineTaskService.assignTaskToUser(
      req.params.id,
      req.body.assignedTo,
      req.user,
    );
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const result = await machineTaskService.deleteTask(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
