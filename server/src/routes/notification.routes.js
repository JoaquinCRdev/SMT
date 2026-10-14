import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// No hay POST: los avisos los genera el sistema (solicitudes de ingreso y el cron de mantenimientos vencidos), no el usuario.
router.get("/unread-count", notificationController.getUnreadCount);
router.get("/", notificationController.getNotifications);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.patch("/:id/unread", notificationController.markUnread);

export default router;
