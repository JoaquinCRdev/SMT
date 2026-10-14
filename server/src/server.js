import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./config/db.js";

await connectDB();

const { default: app } = await import("./app.js");
const { startNotificationJobs } = await import("./jobs/maintenanceDue.job.js");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Solo acá, nunca en app.js: los tests importan app.js directamente y no deben disparar cron.
  startNotificationJobs();
});
