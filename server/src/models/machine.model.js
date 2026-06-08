import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [15, "Name must be at least 15 characters long"],
      maxlength: [100, "Name must be at most 100 characters long"],
    },

    brand: {
      type: String,
      required: true,
      minlength: [2, "Brand must be at least 2 characters long"],
      maxlength: [50, "Brand must be at most 50 characters long"],
    },

    model: {
        type: String,
        required: true,
        minlength: [2, "Model must be at least 2 characters long"],
        maxlength: [50, "Model must be at most 50 characters long"],
    },

    serialNumber: {
        type: String,
        required: true,
        unique: true,
        minlength: [5, "Serial Number must be at least 5 characters long"],
        maxlength: [50, "Serial Number must be at most 50 characters long"],
    },

    description: {
        type: String,
        maxlength: [500, "Description must be at most 500 characters long"],
    },

    status: {
        type: String,
        enum: ["active", "inactive", "maintenance"],
        default: "active",
    },

    userId: {
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

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;