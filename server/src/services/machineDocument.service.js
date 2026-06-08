import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import Machine from "../models/machine.model.js";
import MachineDocument from "../models/machineDocument.model.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getAccessibleMachine(machineId, user) {
  if (!isValidObjectId(machineId)) throw new ApiError("Invalid machine id", 400);

  const machine = await Machine.findById(machineId);
  if (!machine) throw new ApiError("Machine not found", 404);

  if (user?.role !== "admin" && String(machine.userId) !== String(user.id)) {
    throw new ApiError("Forbidden", 403);
  }

  return machine;
}

export async function uploadMachineDocument(machineId, payload, user) {
  await getAccessibleMachine(machineId, user);

  const document = await MachineDocument.create({
    machineId,
    fileName: payload.fileName,
    fileUrl: payload.fileUrl,
    storagePath: payload.storagePath,
    fileType: payload.fileType,
    fileSize: payload.fileSize,
  });

  return document;
}

export async function getMachineDocuments(machineId, user) {
  await getAccessibleMachine(machineId, user);

  const documents = await MachineDocument.find({ machineId }).sort({ createdAt: -1 });
  return documents;
}

export async function getMachineDocumentById(id, user) {
  if (!isValidObjectId(id)) throw new ApiError("Invalid document id", 400);

  const document = await MachineDocument.findById(id);
  if (!document) throw new ApiError("Document not found", 404);

  await getAccessibleMachine(document.machineId, user);

  return document;
}

export async function updateMachineDocument(id, payload, user) {
  const document = await getMachineDocumentById(id, user);

  if (payload.fileName !== undefined) document.fileName = payload.fileName;
  if (payload.fileUrl !== undefined) document.fileUrl = payload.fileUrl;
  if (payload.storagePath !== undefined) document.storagePath = payload.storagePath;
  if (payload.fileType !== undefined) document.fileType = payload.fileType;
  if (payload.fileSize !== undefined) document.fileSize = payload.fileSize;

  await document.save();
  return document;
}

export async function deleteMachineDocument(id, user) {
  const document = await getMachineDocumentById(id, user);

  await MachineDocument.findByIdAndDelete(document._id);
  return { message: "Document deleted" };
}