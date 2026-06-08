import mongoose from 'mongoose';

const machineImageSchema = new mongoose.Schema(
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
    imageUrl: {
        type: String,
        required: true,
    },
    altText: {
        type: String,
        maxlength: [100, "Alt Text must be at most 100 characters long"]
    },
    sortOrder: {
        type: Number,
        default: 0,
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

const MachineImage = mongoose.model('MachineImage', machineImageSchema);
export default MachineImage;