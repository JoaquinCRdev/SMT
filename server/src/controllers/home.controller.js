import * as homeService from "../services/home.service.js";

export async function getHome(req, res, next) {
  try {
    const result = await homeService.getHome(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
