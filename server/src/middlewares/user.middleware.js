import ApiError from "../utils/ApiError.js";

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Unauthorized"));
    }
    next();
  };
}