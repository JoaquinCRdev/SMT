import * as notificationService from "../services/notification.service.js";

export async function getNotifications(req, res, next) {
  try {
    const result = await notificationService.listNotifications(
      req.user,
      req.query,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const result = await notificationService.getUnreadCount(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(
      req.params.id,
      req.user,
    );
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
}

export async function markUnread(req, res, next) {
  try {
    const notification = await notificationService.markUnread(
      req.params.id,
      req.user,
    );
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllRead(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
