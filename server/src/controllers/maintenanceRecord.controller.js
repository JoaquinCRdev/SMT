import * as maintenanceRecordService from "../services/maintenanceRecord.service.js";

export async function createRecord(req, res, next) {
  try {
    const record = await maintenanceRecordService.createRecord(
      { ...req.body, machineId: req.params.id },
      req.user,
    );
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function getRecords(req, res, next) {
  try {
    const result = await maintenanceRecordService.getRecords(
      req.user,
      req.query,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRecordsByMachine(req, res, next) {
  try {
    const result = await maintenanceRecordService.getRecordsByMachine(
      req.params.id,
      req.user,
      req.query,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
