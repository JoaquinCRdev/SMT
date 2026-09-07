import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Evita que un mismo usuario tenga más de una solicitud pendiente
joinRequestSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export default mongoose.model("WorkshopJoinRequest", joinRequestSchema);
