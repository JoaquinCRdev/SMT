import mongoose from 'mongoose';

const machineTaskSchema = new mongoose.Schema(
  {
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine',
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
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "done"],
        default: "pending",
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
  },
  {
    timestamps: true
  }
);

const MachineTask = mongoose.model('MachineTask', machineTaskSchema);
export default MachineTask;