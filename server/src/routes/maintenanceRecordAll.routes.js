import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import * as maintenanceRecordController from "../controllers/maintenanceRecord.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", maintenanceRecordController.getRecords);

export default router;
