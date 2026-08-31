import * as workshopService from "../services/workshop.service.js";

export async function createWorkshop(req, res, next) {
  try {
    const workshop = await workshopService.createWorkshop(req.user, req.body);
    res.status(201).json(workshop);
  } catch (error) {
    next(error);
  }
}

export async function resolveRequest(req, res, next) {
  try {
    const request = await workshopService.resolveRequest(
      req.params.requestId,
      req.user,
      req.body.status,
    );
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
}

export async function getMyWorkshop(req, res, next) {
  try {
    const workshop = await workshopService.getMyWorkshop(req.user);
    res.status(200).json(workshop);
  } catch (error) {
    next(error);
  }
}

export async function requestToJoin(req, res, next) {
  try {
    const request = await workshopService.requestToJoin(req.user, req.body.code);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

export async function listRequests(req, res, next) {
  try {
    const requests = await workshopService.listRequests(req.user);
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
}

export async function updateWorkshop(req, res, next) {
  try {
    const workshop = await workshopService.updateWorkshop(
      req.params.id,
      req.user,
      req.body,
    );
    res.status(200).json(workshop);
  } catch (error) {
    next(error);
  }
}

export async function regenerateCode(req, res, next) {
  try {
    const workshop = await workshopService.regenerateCode(
      req.params.id,
      req.user,
    );
    res.status(200).json(workshop);
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req, res, next) {
  try {
    const result = await workshopService.removeMember(
      req.params.id,
      req.params.userId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkshop(req, res, next) {
  try {
    const result = await workshopService.deleteWorkshop(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function leaveWorkshop(req, res, next) {
  try {
    const result = await workshopService.leaveWorkshop(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
