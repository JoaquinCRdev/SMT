import * as machineService from "../services/machine.service.js";

export async function createMachine(req, res, next) {
  try {
    const machine = await machineService.createMachine(req.body, req.user);
    res.status(201).json(machine);
  } catch (error) {
    next(error);
  }
}

export async function getMachines(req, res, next) {
  try {
    const result = await machineService.getMachines(req.user, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMachineById(req, res, next) {
  try {
    const machine = await machineService.getMachineById(
      req.params.id,
      req.user,
    );
    res.status(200).json(machine);
  } catch (error) {
    next(error);
  }
}

export async function updateMachine(req, res, next) {
  try {
    const machine = await machineService.updateMachine(
      req.params.id,
      req.body,
      req.user,
    );
    res.status(200).json(machine);
  } catch (error) {
    next(error);
  }
}

export async function changeMachineStatus(req, res, next) {
  try {
    const machine = await machineService.changeMachineStatus(
      req.params.id,
      req.body.status,
      req.user,
    );
    res.status(200).json(machine);
  } catch (error) {
    next(error);
  }
}

export async function deleteMachine(req, res, next) {
  try {
    const result = await machineService.deleteMachine(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
