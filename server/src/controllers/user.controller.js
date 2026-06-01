import * as userService from "../services/user.service.js";

export async function register(req, res, next) {
  try {
    const result = await userService.register(req.body);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true, // solo HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
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
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true, // solo HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
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
    const result = await userService.getUsers();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    await userService.forgotPassword(req.body.email);
    res.status(200).json({ message: "Password reset link sent" });
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
