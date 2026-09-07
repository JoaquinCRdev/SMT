import mongoose from "mongoose";

const maintenanceRecordSchema = new mongoose.Schema(
  {
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaintenancePlan",
    },
    title: {
      type: String,
      required: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [100, "Title must be at most 100 characters long"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description must be at most 1000 characters long"],
    },
    performedAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      min: [0, "Duration must be a positive number"],
    },
    cost: {
      type: Number,
      min: [0, "Cost must be a positive number"],
    },
    partsUsed: {
      type: String,
      maxlength: [500, "Parts description must be at most 500 characters"],
    },
    technician: {
      type: String,
      maxlength: [100, "Technician name must be at most 100 characters"],
    },
    results: {
      type: String,
      maxlength: [500, "Results must be at most 500 characters"],
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

const MaintenanceRecord = mongoose.model(
  "MaintenanceRecord",
  maintenanceRecordSchema,
);
export default MaintenanceRecord;
