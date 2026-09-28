import crypto from "crypto";
import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "10d";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL,
    },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    // El jti hace que dos tokens emitidos dentro del mismo segundo sean
    // distintos. Sin él, la rotación borraría el token nuevo junto al viejo,
    // porque el payload (id, email, role, iat) sería idéntico.
    {
      id: user._id,
      email: user.email,
      role: user.role,
      jti: crypto.randomUUID(),
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_TTL,
    },
  );
};

export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

export const verifyRefreshToken = (token) =>
  verifyToken(token, process.env.JWT_REFRESH_SECRET);
