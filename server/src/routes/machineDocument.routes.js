import { Router } from "express";
import * as machineDocumentController from "../controllers/machineDocument.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "../middlewares/validators/machineDocument.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  validate(createDocumentSchema),
  machineDocumentController.uploadMachineDocument,
);
router.get("/", machineDocumentController.getMachineDocuments);
router.get("/:id", machineDocumentController.getMachineDocumentById);
router.patch(
  "/:id",
  validate(updateDocumentSchema),
  machineDocumentController.updateMachineDocument,
);
router.delete("/:id", machineDocumentController.deleteMachineDocument);

export default router;
