import * as taskLogService from "../services/taskLog.service.js";

export async function getTaskLogsByMachine(req, res, next) {
  try {
    const logs = await taskLogService.getTaskLogsByMachine(req.params.machineId, req.user);
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
}

export async function getTaskLogsByTask(req, res, next) {
  try {
    const logs = await taskLogService.getTaskLogsByTask(req.params.taskId, req.user);
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
}

export async function getTaskLogsByUser(req, res, next) {
  try {
    const logs = await taskLogService.getTaskLogsByUser(req.params.userId, req.user);
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
}