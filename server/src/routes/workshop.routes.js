import { Router } from "express";
import * as workshopController from "../controllers/workshop.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/user.middleware.js";
import { validate } from "../middlewares/validators/validate.middleware.js";
import {
  createWorkshopSchema,
  joinWorkshopSchema,
  requestActionSchema,
  updateWorkshopSchema,
} from "../middlewares/validators/workshop.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createWorkshopSchema),
  authorize("admin"),
  workshopController.createWorkshop,
);
router.get("/mine", workshopController.getMyWorkshop);
router.get("/mine/members", workshopController.getMembers);
router.post(
  "/join",
  validate(joinWorkshopSchema),
  workshopController.requestToJoin,
);
router.get("/requests", authorize("admin"), workshopController.listRequests);
router.patch(
  "/requests/:requestId",
  validate(requestActionSchema),
  authorize("admin"),
  workshopController.resolveRequest,
);
router.patch(
  "/:id",
  validate(updateWorkshopSchema),
  authorize("admin"),
  workshopController.updateWorkshop,
);
router.delete(
  "/:id/members/:userId",
  authorize("admin"),
  workshopController.removeMember,
);
router.post(
  "/:id/code/regenerate",
  authorize("admin"),
  workshopController.regenerateCode,
);
router.delete("/:id", authorize("admin"), workshopController.deleteWorkshop);
router.post("/leave", workshopController.leaveWorkshop);

export default router;
