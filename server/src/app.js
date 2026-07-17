import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import errorHandler from "./middlewares/error.middleware.js";
import machineRoutes from "./routes/machine.routes.js";
import userRoutes from "./routes/user.routes.js";
import maintenanceRecordRoutes from "./routes/maintenanceRecord.routes.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api", machineRoutes);
app.use("/api/records", maintenanceRecordRoutes);
app.use(errorHandler);

export default app;
