import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResetEmail } from "../utils/email.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

// Cuántas sesiones abiertas se guarda por usuario. Los tokens más viejos se
// descartan para que el array no crezca sin límite con cada login.
const MAX_REFRESH_TOKENS = 5;

// Los cambios en refreshTokens se hacen con updateOne y no con document.save():
// save() usa control de concurrencia por __v, así que dos refreshes simultáneos
// sobre el mismo usuario (dos pestañas, o varias requests que vencen a la vez)
// Provocaban VersionError y terminaban en un 500.
const pushRefreshToken = (userId, token) =>
  User.updateOne(
    { _id: userId },
    {
      $push: {
        refreshTokens: {
          $each: [token],
          $slice: -MAX_REFRESH_TOKENS,
        },
      },
    },
  );

const pullRefreshToken = (userId, token) =>
  User.updateOne({ _id: userId }, { $pull: { refreshTokens: token } });

// El campo password es select:false, pero User.create y las consultas con
// select("+password") lo traen igual. Sin esto, el hash se serializaba en la
// respuesta de /register y /login.
const safeUser = (user) => {
  const { password, ...rest } = user.toObject();
  return rest;
};

export const register = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }
  // El rol no se elige al registrarse: se define según la acción posterior.
  // Unirme a un taller deja role "user", crear un taller lo deja "admin".
  const user = await User.create({ ...userData, role: "user" });
  const refreshToken = generateRefreshToken(user);
  const accessToken = generateAccessToken(user);

  await pushRefreshToken(user._id, refreshToken);

  return { user: safeUser(user), accessToken, refreshToken };
};

export const login = async (userData) => {
  const user = await User.findOne({ email: userData.email }).select("+password");
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

  await pushRefreshToken(user._id, refreshToken);

  return { user: safeUser(user), accessToken, refreshToken };
};

export const logout = async (userId, token) => {
  const exists = await User.exists({ _id: userId });
  if (!exists) throw new ApiError(404, "User not found");

  await pullRefreshToken(userId, token);
};

export const refreshToken = async (token) => {
  if (!token) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Antes solo se buscaba el token en la base, así que su expiración de 10d
  // nunca se comprobaba: un token vencido seguía funcionando mientras
  // estuviera en el array.
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Consumo atómico del token: el filtro exige que siga en el array, así que
  // un reuso del mismo token (o una carrera entre dos refreshes) no encuentra
  // documento y se rechaza.
  const user = await User.findOneAndUpdate(
    { _id: payload.id, refreshTokens: token, isActive: true },
    { $pull: { refreshTokens: token } },
    { returnDocument: "after" },
  );
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const nuevoRefreshToken = generateRefreshToken(user);
  await pushRefreshToken(user._id, nuevoRefreshToken);

  return {
    user,
    accessToken: generateAccessToken(user),
    refreshToken: nuevoRefreshToken,
  };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

export const getUsers = async (user) => {
  if (!user.workshop) {
    throw new ApiError(403, "You do not belong to a workshop");
  }
  return User.find({ workshop: user.workshop }).select(
    "name email role isActive",
  );
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
