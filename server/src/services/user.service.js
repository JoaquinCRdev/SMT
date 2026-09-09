import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResetEmail } from "../utils/email.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

export const register = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }
  const user = await User.create(userData);
  const refreshToken = generateRefreshToken(user);
  const accessToken = generateAccessToken(user);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const login = async (userData) => {
  const user = await User.findOne({ email: userData.email }).select(
    "+password +refreshTokens",
  );
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  const isPasswordValid = await user.comparePassword(userData.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  if (!user.isActive) {
    throw new ApiError(403, "User is not active");
  }
  const refreshToken = generateRefreshToken(user);
  const accessToken = generateAccessToken(user);

  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

export const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) throw new ApiError(404, "User not found");

  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  await user.save({ validateBeforeSave: false });
};

export const refreshToken = async (refreshToken) => {
  const user = await User.findOne({ refreshTokens: refreshToken }).select(
    "+refreshTokens",
  );
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const accessToken = generateAccessToken(user);
  return { user, accessToken };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

export const getUsers = async () => {
  const users = await User.find();
  return users;
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email }).select(
    "+resetPasswordToken +resetPasswordExpires",
  );
  if (user) {
    const rawToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });
    await sendResetEmail({ to: email, rawToken });
  }
  return { message: "If that user exists a code will be sent" };
};

export const resetPassword = async (token, newPassword) => {
  const user = await User.findByResetToken(token);
  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: "Password reset successfully" };
};
