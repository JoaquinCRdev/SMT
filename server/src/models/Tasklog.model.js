import mongoose from 'mongoose';

const taskLogSchema = new mongoose.Schema(
  {
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
    },
    machineId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine',
        required: true,
    },
    taskId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MachineTask',
        required: true,
    },
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: ["created", "updated", "deleted", "reopened"],
    },
    notes: {
        type: String,
        maxlength: [500, "Notes must be at most 500 characters long"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
  },
  {
    timestamps: true
  }
);

const TaskLog = mongoose.model('TaskLog', taskLogSchema);
export default TaskLog;