import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../middlewares/validators/user.validator.js";
import { validate } from "../middlewares/validators/validate.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), userController.register);
router.post("/login", validate(loginSchema), userController.login);
router.post("/refresh", userController.refresh);
router.post("/logout", authenticate, userController.logout);
router.get("/profile", authenticate, userController.getProfile);
router.get("/users", authenticate, authorize("admin"), userController.getUsers);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  userController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  userController.resetPassword,
);

export default router;
