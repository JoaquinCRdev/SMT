import { Router } from "express";
import * as workshopController from "../controllers/workshop.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/user.middleware.js";
import { validate } from "../middlewares/validators/validate.middleware.js";
import {
  addMemberSchema,
  createWorkshopSchema,
  joinWorkshopSchema,
  requestActionSchema,
  updateMemberSchema,
  updateWorkshopSchema,
  verifyJoinCodeSchema,
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
  "/mine/members",
  validate(addMemberSchema),
  authorize("admin"),
  workshopController.addMember,
);
router.patch(
  "/mine/members/:userId",
  validate(updateMemberSchema),
  authorize("admin"),
  workshopController.updateMember,
);

router.post(
  "/join",
  validate(joinWorkshopSchema),
  workshopController.requestToJoin,
);
router.post(
  "/verify-code",
  validate(verifyJoinCodeSchema),
  workshopController.verifyJoinCode,
);
router.get("/requests/mine", workshopController.getMyRequest);
router.get("/requests", authorize("admin"), workshopController.listRequests);
router.patch(
  "/requests/:requestId",
  validate(requestActionSchema),
  authorize("admin"),
  workshopController.resolveRequest,
);

router.post("/leave", workshopController.leaveWorkshop);
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
router.patch(
  "/requests/:requestId/cancel",
  authorize("admin"),
  workshopController.cancelApprovedRequest,
);
router.delete("/:id", authorize("admin"), workshopController.deleteWorkshop);

export default router;