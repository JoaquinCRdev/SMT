import { Router } from "express";
import * as maintenancePlanController from "../controllers/maintenancePlan.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", maintenancePlanController.getAllPlans);

export default router;
