export function getRedirectPath(user) {
  if (user?.workshop) return "/home";
  if (user?.role === "admin") return "/crearTaller";
  return "/asociarseTaller";
}