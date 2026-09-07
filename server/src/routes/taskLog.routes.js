import { Router } from "express";
import * as taskLogController from "../controllers/taskLog.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", taskLogController.getTaskLogsByMachine);
router.get("/task/:taskId", taskLogController.getTaskLogsByTask);

export default router;
