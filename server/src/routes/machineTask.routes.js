import { Router } from "express";
import * as machineTaskController from "../controllers/machineTask.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  assignTaskSchema,
  changeTaskStatusSchema,
  createTaskSchema,
  updateTaskSchema,
} from "../middlewares/validators/machineTask.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  validate(createTaskSchema),
  machineTaskController.createTask,
);
router.get("/", machineTaskController.getTasksByMachine);
router.get("/:id", machineTaskController.getTaskById);
router.put(
  "/:id",
  validate(updateTaskSchema),
  machineTaskController.updateTask,
);
router.patch(
  "/:id/status",
  validate(changeTaskStatusSchema),
  machineTaskController.changeTaskStatus,
);
router.patch(
  "/:id/assign",
  validate(assignTaskSchema),
  machineTaskController.assignTaskToUser,
);
router.delete("/:id", machineTaskController.deleteTask);

export default router;
