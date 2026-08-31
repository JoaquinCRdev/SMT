import crypto from "node:crypto";
import Workshop from "../models/workshop.model.js";
import WorkshopJoinRequest from "../models/workshopJoinRequest.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

async function assertOwner(workshopId, userId) {
  const workshop = await Workshop.findById(workshopId);
  if (!workshop) throw new ApiError(404, "Workshop not found");
  if (String(workshop.owner) !== String(userId)) {
    throw new ApiError(403, "Only the workshop admin can do this");
  }
  return workshop;
}

export async function createWorkshop(user, payload) {
  const existing = await User.findById(user.id);
  if (!existing) throw new ApiError(404, "User not found");
  if (existing.workshop)
    throw new ApiError(409, "You already belong to a workshop");

  const workshop = await Workshop.create({ ...payload, owner: user.id });
  await User.findByIdAndUpdate(user.id, { workshop: workshop._id });
  return workshop;
}

export async function requestToJoin(user, code) {
  if (user.workshop)
    throw new ApiError(409, "You already belong to a workshop");

  const workshop = await Workshop.findOne({ code });
  if (!workshop) throw new ApiError(404, "Invalid workshop code");

  try {
    return await WorkshopJoinRequest.create({
      user: user.id,
      workshop: workshop._id,
    });
  } catch (err) {
    if (err.code === 11000)
      throw new ApiError(409, "You already have a pending request");
    throw err;
  }
}

export async function resolveRequest(requestId, user, status) {
  const request = await WorkshopJoinRequest.findById(requestId);
  if (!request) throw new ApiError(404, "Request not found");

  const workshop = await assertOwner(request.workshop, user.id);
  if (request.status !== "pending")
    throw new ApiError(400, "Request already resolved");

  const requester = await User.findById(request.user);
  if (!requester || requester.workshop) {
    throw new ApiError(409, "User already belongs to another workshop");
  }

  request.status = status;
  await request.save();
  if (status === "approved") {
    await User.findByIdAndUpdate(requester._id, { workshop: workshop._id });
  }
  return request;
}

export async function getMyWorkshop(user) {
  if (!user.workshop) throw new ApiError(404, "Workshop not found");
  const workshop = await Workshop.findById(user.workshop).populate(
    "owner",
    "name email",
  );
  if (!workshop) throw new ApiError(404, "Workshop not found");
  return workshop;
}

export async function listRequests(user) {
  if (!user.workshop) throw new ApiError(404, "Workshop not found");
  const workshop = await assertOwner(user.workshop, user.id);

  return WorkshopJoinRequest.find({ workshop: workshop._id, status: "pending" })
    .sort({ createdAt: -1 })
    .populate("user", "name email");
}

export async function updateWorkshop(id, user, payload) {
  const workshop = await assertOwner(id, user.id);

  if (payload.name !== undefined) workshop.name = payload.name;
  if (payload.address !== undefined) workshop.address = payload.address;
  if (payload.phone !== undefined) workshop.phone = payload.phone;

  await workshop.save();
  return workshop;
}

export async function regenerateCode(id, user) {
  const workshop = await assertOwner(id, user.id);

  workshop.code = crypto.randomBytes(4).toString("hex").toUpperCase();
  await workshop.save();
  return workshop;
}

export async function removeMember(id, userId, owner) {
  const workshop = await assertOwner(id, owner.id);

  if (String(workshop.owner) === String(userId)) {
    throw new ApiError(400, "Cannot remove the workshop admin");
  }

  const member = await User.findById(userId);
  if (!member || String(member.workshop) !== String(workshop._id)) {
    throw new ApiError(404, "User is not a member of this workshop");
  }

  await User.findByIdAndUpdate(userId, { workshop: null });
  return { message: "Member removed" };
}

export async function deleteWorkshop(id, user) {
  const workshop = await assertOwner(id, user.id);

  await User.updateMany(
    { workshop: workshop._id },
    { $set: { workshop: null } },
  );
  await WorkshopJoinRequest.deleteMany({ workshop: workshop._id });
  await Workshop.findByIdAndDelete(workshop._id);

  return { message: "Workshop deleted" };
}

export async function leaveWorkshop(user) {
  if (!user.workshop) throw new ApiError(400, "You do not belong to a workshop");

  const workshop = await Workshop.findById(user.workshop);
  if (!workshop) throw new ApiError(404, "Workshop not found");

  if (String(workshop.owner) === String(user.id)) {
    throw new ApiError(400, "The workshop admin cannot leave");
  }

  await User.findByIdAndUpdate(user.id, { workshop: null });
  return { message: "You left the workshop" };
}
