import mongoose from "mongoose";

const maintenancePlanSchema = new mongoose.Schema(
  {
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    title: {
      type: String,
      required: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [100, "Title must be at most 100 characters long"],
    },
    description: {
      type: String,
      maxlength: [500, "Description must be at most 500 characters long"],
    },
    frequency: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "yearly", "custom"],
    },
    customDays: {
      type: Number,
      min: [1, "Custom days must be at least 1"],
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MachineTask",
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    lastPerformed: Date,
    nextDue: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes must be at most 1000 characters long"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const MaintenancePlan = mongoose.model(
  "MaintenancePlan",
  maintenancePlanSchema,
);
export default MaintenancePlan;
