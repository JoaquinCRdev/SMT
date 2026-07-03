import { Router } from "express";
import {
  createMachine,
  getMachineById,
  updateMachine,
  deleteMachine,
} from "../controllers/machine.controller.js";
import { validate } from "../middlewares/validators/validate.middleware.js";
import { machineSchema } from "../middlewares/validators/machine.validator.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/machine", validate(machineSchema), authenticate, createMachine);
router.get("/machine:id", authenticate, getMachineById);
router.put("/machine:id", authenticate, updateMachine);
router.delete("/machine:id", authenticate, deleteMachine);

export default router;
