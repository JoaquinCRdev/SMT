import { Router } from "express";
import * as homeController from "../controllers/home.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", homeController.getHome);

export default router;
