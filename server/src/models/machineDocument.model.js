import mongoose from 'mongoose';

const machineDocumentSchema = new mongoose.Schema(
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
    fileName: {
        type: String,
        required: true,
        minlength: [5, "File Name must be at least 5 characters long"],
        maxlength: [100, "File Name must be at most 100 characters long"],
    },
    fileUrl: {
        type: String,
        required: true,
    },
    storagePath: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
        enum: ['pdf', 'docx', 'xlsx', 'txt', 'other'],
    },
    fileSize: {
        type: Number,
        required: true,
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

const MachineDocument = mongoose.model('MachineDocument', machineDocumentSchema);
export default MachineDocument;