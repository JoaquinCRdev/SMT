import { Router } from "express";
import * as maintenancePlanController from "../controllers/maintenancePlan.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  createPlanSchema,
  markPerformedSchema,
  updatePlanSchema,
} from "../middlewares/validators/maintenancePlan.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  validate(createPlanSchema),
  maintenancePlanController.createPlan,
);
router.get("/", maintenancePlanController.getPlans);
router.get("/:planId", maintenancePlanController.getPlanById);
router.put(
  "/:planId",
  validate(updatePlanSchema),
  maintenancePlanController.updatePlan,
);
router.delete("/:planId", maintenancePlanController.deletePlan);
router.patch(
  "/:planId/performed",
  validate(markPerformedSchema),
  maintenancePlanController.markPerformed,
);

export default router;
