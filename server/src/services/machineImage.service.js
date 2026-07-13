import mongoose from "mongoose";
import Machine from "../models/machine.model.js";
import MachineImage from "../models/machineImage.model.js";
import ApiError from "../utils/ApiError.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getAccessibleMachine(machineId, user) {
  if (!isValidObjectId(machineId))
    throw new ApiError(400, "Invalid machine id");

  const machine = await Machine.findById(machineId);
  if (!machine) throw new ApiError(404, "Machine not found");

  if (user?.role !== "admin" && String(machine.userId) !== String(user.id)) {
    throw new ApiError(403, "Forbidden");
  }

  return machine;
}

export async function addMachineImage(machineId, payload, user) {
  await getAccessibleMachine(machineId, user);

  const image = await MachineImage.create({
    machineId,
    imageUrl: payload.imageUrl,
    altText: payload.altText,
    sortOrder: payload.sortOrder ?? 0,
  });

  return image;
}

export async function getMachineImages(machineId, user) {
  await getAccessibleMachine(machineId, user);

  const images = await MachineImage.find({ machineId }).sort({
    sortOrder: 1,
    createdAt: -1,
  });
  return images;
}

export async function updateMachineImage(id, payload, user) {
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid image id");

  const image = await MachineImage.findById(id);
  if (!image) throw new ApiError(404, "Image not found");

  await getAccessibleMachine(image.machineId, user);

  if (payload.imageUrl !== undefined) image.imageUrl = payload.imageUrl;
  if (payload.altText !== undefined) image.altText = payload.altText;
  if (payload.sortOrder !== undefined) image.sortOrder = payload.sortOrder;

  await image.save();
  return image;
}

export async function updateMachineImageOrder(id, sortOrder, user) {
  return updateMachineImage(id, { sortOrder }, user);
}

export async function deleteMachineImage(id, user) {
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid image id");

  const image = await MachineImage.findById(id);
  if (!image) throw new ApiError(404, "Image not found");

  await getAccessibleMachine(image.machineId, user);

  await MachineImage.findByIdAndDelete(id);
  return { message: "Image deleted" };
}
