import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
await connectDB();

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});
