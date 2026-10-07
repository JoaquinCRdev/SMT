import * as historyService from "../services/history.service.js";

export async function getHistory(req, res, next) {
  try {
    const result = await historyService.getHistory(req.user, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}