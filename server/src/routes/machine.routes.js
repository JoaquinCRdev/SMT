import { Router } from "express";
import {
  createMachine,
  deleteMachine,
  getMachineById,
  getMachines,
  updateMachine,
} from "../controllers/machine.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { machineSchema } from "../middlewares/validators/machine.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";
import machineDocumentRoutes from "./machineDocument.routes.js";
import machineImageRoutes from "./machineImage.routes.js";
import machineTaskRoutes from "./machineTask.routes.js";
import maintenancePlanRoutes from "./maintenancePlan.routes.js";
import maintenanceRecordRoutes from "./maintenanceRecord.routes.js";
import taskLogRoutes from "./taskLog.routes.js";

const router = Router();
router.use("/machine/:machineId/documents", machineDocumentRoutes);
router.use("/machine/:machineId/images", machineImageRoutes);
router.use("/machine/:machineId/tasks", machineTaskRoutes);
router.use("/machine/:machineId/tasklogs", taskLogRoutes);
router.use("/machine/:id/records", maintenanceRecordRoutes);
router.use("/machine/:machineId/plans", maintenancePlanRoutes);
router.get("/machine", authenticate, getMachines);
router.post("/machine", validate(machineSchema), authenticate, createMachine);
router.get("/machine/:id", authenticate, getMachineById);
router.put("/machine/:id", authenticate, updateMachine);
router.delete("/machine/:id", authenticate, deleteMachine);

export default router;
