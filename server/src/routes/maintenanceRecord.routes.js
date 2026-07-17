import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validators/validate.middleware.js";
import { createRecordSchema } from "../middlewares/validators/maintenanceRecord.validator.js";
import * as maintenanceRecordController from "../controllers/maintenanceRecord.controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  validate(createRecordSchema),
  maintenanceRecordController.createRecord,
);
router.get("/", maintenanceRecordController.getRecordsByMachine);

export default router;
