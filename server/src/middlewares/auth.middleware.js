import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided");
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "workshop role isActive",
    );
    if (!user) throw new ApiError(401, "Invalid or expired token");

    // Desactivar a un miembro tiene que cortar sus sesiones, no sólo el login.
    if (!user.isActive) {
      await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
      throw new ApiError(403, "User is not active");
    }

    req.user = {
      id: decoded.id,
      role: user.role,
      workshop: user.workshop ?? null,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, "Invalid or expired token"));
  }
};
