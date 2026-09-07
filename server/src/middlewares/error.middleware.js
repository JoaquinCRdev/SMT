import ApiError from "../utils/ApiError.js";
export default function errorHandler(err, req, res, next) {
  // Si el error es conocido (ApiError), usamos su status
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }
  // Error de Mongoose (ej. validation error en el schema)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
  // Error de MongoDB (ej. duplicate key en email único)
  if (err.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Duplicate field value",
    });
  }
  // Error genérico (no esperado)
  console.error("Unhandled error:", err);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
