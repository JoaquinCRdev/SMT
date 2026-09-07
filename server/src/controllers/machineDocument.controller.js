import * as machineDocumentService from "../services/machineDocument.service.js";

export async function uploadMachineDocument(req, res, next) {
  try {
    const document = await machineDocumentService.uploadMachineDocument(
      req.params.machineId,
      req.body,
      req.user,
    );
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export async function getMachineDocuments(req, res, next) {
  try {
    const documents = await machineDocumentService.getMachineDocuments(req.params.machineId, req.user);
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
}

export async function getMachineDocumentById(req, res, next) {
  try {
    const document = await machineDocumentService.getMachineDocumentById(req.params.id, req.user);
    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
}

export async function updateMachineDocument(req, res, next) {
  try {
    const document = await machineDocumentService.updateMachineDocument(req.params.id, req.body, req.user);
    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
}

export async function deleteMachineDocument(req, res, next) {
  try {
    const result = await machineDocumentService.deleteMachineDocument(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}