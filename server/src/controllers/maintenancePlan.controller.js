import * as maintenancePlanService from "../services/maintenancePlan.service.js";

export async function createPlan(req, res, next) {
  try {
    const plan = await maintenancePlanService.createMaintenancePlan(
      req.params.machineId,
      req.body,
      req.user,
    );
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
}

export async function getPlans(req, res, next) {
  try {
    const result = await maintenancePlanService.getPlansByMachine(
      req.params.machineId,
      req.user,
      req.query,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPlanById(req, res, next) {
  try {
    const plan = await maintenancePlanService.getPlanById(
      req.params.machineId,
      req.params.planId,
      req.user,
    );
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
}

export async function updatePlan(req, res, next) {
  try {
    const plan = await maintenancePlanService.updatePlan(
      req.params.machineId,
      req.params.planId,
      req.body,
      req.user,
    );
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
}

export async function deletePlan(req, res, next) {
  try {
    const result = await maintenancePlanService.deletePlan(
      req.params.machineId,
      req.params.planId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markPerformed(req, res, next) {
  try {
    const plan = await maintenancePlanService.markPlanPerformed(
      req.params.machineId,
      req.params.planId,
      req.user,
      req.body,
    );
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
}
