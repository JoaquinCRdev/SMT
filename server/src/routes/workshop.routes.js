import { Router } from "express";
import * as workshopController from "../controllers/workshop.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  createWorkshopSchema,
  joinWorkshopSchema,
  requestActionSchema,
  updateWorkshopSchema,
} from "../middlewares/validators/workshop.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createWorkshopSchema),
  workshopController.createWorkshop,
);
router.get("/mine", workshopController.getMyWorkshop);
router.post(
  "/join",
  validate(joinWorkshopSchema),
  workshopController.requestToJoin,
);
router.get("/requests", workshopController.listRequests);
router.patch(
  "/requests/:requestId",
  validate(requestActionSchema),
  workshopController.resolveRequest,
);
router.patch(
  "/:id",
  validate(updateWorkshopSchema),
  workshopController.updateWorkshop,
);
router.delete("/:id/members/:userId", workshopController.removeMember);
router.post("/:id/code/regenerate", workshopController.regenerateCode);
router.delete("/:id", workshopController.deleteWorkshop);
router.post("/leave", workshopController.leaveWorkshop);

export default router;
