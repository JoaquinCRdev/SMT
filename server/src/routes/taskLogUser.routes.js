import { Router } from "express";
import * as taskLogController from "../controllers/taskLog.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/user/:userId", authenticate, taskLogController.getTaskLogsByUser);

export default router;
