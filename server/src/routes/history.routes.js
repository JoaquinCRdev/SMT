import { Router } from "express";
import * as historyController from "../controllers/history.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", historyController.getHistory);

export default router;