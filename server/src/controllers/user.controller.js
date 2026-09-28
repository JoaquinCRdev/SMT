import * as userService from "../services/user.service.js";

// La cookie y el JWT se renuevan juntos: si la cookie durara menos que el
// token, la sesión cortaría antes de que expire el token.
const REFRESH_COOKIE_MAX_AGE = 10 * 24 * 60 * 60 * 1000; // 10 días

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
};

export async function register(req, res, next) {
  try {
    const result = await userService.register(req.body);
    setRefreshCookie(res, result.refreshToken);
    res
      .status(201)
      .json({ user: result.user, accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await userService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    res
      .status(200)
      .json({ user: result.user, accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const result = await userService.refreshToken(req.cookies.refreshToken);
    // La rotación invalida el token anterior, así que la cookie se renueva con
    // el nuevo; si no, el siguiente refresh fallaría.
    setRefreshCookie(res, result.refreshToken);
    res
      .status(200)
      .json({ user: result.user, accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await userService.logout(req.user.id, req.cookies.refreshToken);
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const result = await userService.getProfile(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    const result = await userService.getUsers(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await userService.forgotPassword(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await userService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}
