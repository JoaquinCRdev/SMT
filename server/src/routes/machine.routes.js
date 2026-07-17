import { Router } from "express";
import {
  createMachine,
  deleteMachine,
  getMachineById,
  updateMachine,
} from "../controllers/machine.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { machineSchema } from "../middlewares/validators/machine.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";
import maintenancePlanRoutes from "./maintenancePlan.routes.js";
import maintenanceRecordRoutes from "./maintenanceRecord.routes.js";

const router = Router();
router.use("/machine/:id/records", maintenanceRecordRoutes);
router.use("/machine/:machineId/plans", maintenancePlanRoutes);
router.post("/machine", validate(machineSchema), authenticate, createMachine);
router.get("/machine/:id", authenticate, getMachineById);
router.put("/machine/:id", authenticate, updateMachine);
router.delete("/machine/:id", authenticate, deleteMachine);

export default router;
