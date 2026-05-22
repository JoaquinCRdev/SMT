import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  loginSchema,
  registerSchema,
} from "../middlewares/validators/user.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), userController.register);
router.post("/login", validate(loginSchema), userController.login);
router.post("/refresh", userController.refresh);
router.post("/logout", authenticate, userController.logout);
router.get("/profile", authenticate, userController.getProfile);
router.get("/users", authenticate, authorize("admin"), userController.getUsers);

export default router;
