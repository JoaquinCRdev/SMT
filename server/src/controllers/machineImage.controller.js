import * as machineImageService from "../services/machineImage.service.js";

export async function addMachineImage(req, res, next) {
  try {
    const image = await machineImageService.addMachineImage(req.params.machineId, req.body, req.user);
    res.status(201).json(image);
  } catch (error) {
    next(error);
  }
}

export async function getMachineImages(req, res, next) {
  try {
    const images = await machineImageService.getMachineImages(req.params.machineId, req.user);
    res.status(200).json(images);
  } catch (error) {
    next(error);
  }
}

export async function updateMachineImage(req, res, next) {
  try {
    const image = await machineImageService.updateMachineImage(req.params.id, req.body, req.user);
    res.status(200).json(image);
  } catch (error) {
    next(error);
  }
}

export async function updateMachineImageOrder(req, res, next) {
  try {
    const image = await machineImageService.updateMachineImageOrder(
      req.params.id,
      req.body.sortOrder,
      req.user,
    );
    res.status(200).json(image);
  } catch (error) {
    next(error);
  }
}

export async function deleteMachineImage(req, res, next) {
  try {
    const result = await machineImageService.deleteMachineImage(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}