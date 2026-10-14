export function getRedirectPath(user) {
  if (user?.workshop) return "/home";
  return "/elegirTaller";
}
