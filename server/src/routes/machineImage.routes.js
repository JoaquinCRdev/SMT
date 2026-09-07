import { Router } from "express";
import * as machineImageController from "../controllers/machineImage.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  addImageSchema,
  reorderImageSchema,
  updateImageSchema,
} from "../middlewares/validators/machineImage.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  validate(addImageSchema),
  machineImageController.addMachineImage,
);
router.get("/", machineImageController.getMachineImages);
router.patch(
  "/:id",
  validate(updateImageSchema),
  machineImageController.updateMachineImage,
);
router.patch(
  "/:id/order",
  validate(reorderImageSchema),
  machineImageController.updateMachineImageOrder,
);
router.delete("/:id", machineImageController.deleteMachineImage);

export default router;
