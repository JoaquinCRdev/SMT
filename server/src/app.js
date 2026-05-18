import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import userRoutes from "./routes/user.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/api", userRoutes);
app.use(errorHandler);

export default app;
