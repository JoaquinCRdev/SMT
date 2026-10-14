import ApiError from "./ApiError.js";

const STATUS_MAP = {
  operativo: "active",
  mantenimiento: "maintenance",
  baja: "inactive",
};

const VALID_STATUSES = ["active", "inactive", "maintenance"];

export function normalizeStatus(status) {
  return STATUS_MAP[status] ?? status;
}

export function normalizeAndValidateStatus(status) {
  const normalized = normalizeStatus(status);
  if (!VALID_STATUSES.includes(normalized)) {
    throw new ApiError(400, "Invalid status");
  }
  return normalized;
}
