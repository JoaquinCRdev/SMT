import mongoose from "mongoose";
import crypto from "node:crypto";

const workshopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(4).toString("hex").toUpperCase(),
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Workshop", workshopSchema);
