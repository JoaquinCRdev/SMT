import { Router } from "express";
import * as maintenanceRecordController from "../controllers/maintenanceRecord.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", maintenanceRecordController.getRecords);

export default router;
