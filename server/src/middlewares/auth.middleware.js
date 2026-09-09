import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";
import User from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided");
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("workshop role");
    req.user = {
      id: decoded.id,
      role: decoded.role,
      workshop: user?.workshop ?? null,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Unauthorized"));
    }
    next();
  };
}
