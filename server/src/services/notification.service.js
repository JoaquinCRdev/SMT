import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import { isValidObjectId } from "../utils/access.js";
import { getPagination } from "../utils/pagination.js";

const TYPES = ["mantenimiento", "taller", "sistema"];

/**
 * Alcance de lectura. Todo aviso de taller nace atado a un taller, y esa
 * es la garantía de que nadie lee lo de otro taller.
 *
 * Excepción: quien todavía no pertenece a ningún taller (recién registrado,
 * esperando que le aprueben el ingreso) sí debe poder leer los avisos
 * dirigidos a él, como el de "solicitud aprobada". Por eso no se exige
 * `requireWorkshop` en las lecturas.
 */
function scopeFor(user) {
  if (!user.workshop) return { recipient: user.id };

  return {
    workshop: user.workshop,
    $or: [{ recipient: null }, { recipient: user.id }],
  };
}

function isVisible(notification, user) {
  // Aviso dirigido a una persona: sólo la puede tocar esa persona.
  if (notification.recipient) {
    return String(notification.recipient) === String(user.id);
  }

  // Aviso de taller: cualquiera del taller, y nadie más.
  return (
    Boolean(user.workshop) &&
    String(notification.workshop) === String(user.workshop)
  );
}

/**
 * Crea un aviso. Las notificaciones nunca deben tumbar la operación que
 * las originó (alta de solicitud, aprobación, etc.), así que los errores
 * se registran y se absorben.
 */
async function safeNotify(payload) {
  try {
    return await Notification.create(payload);
  } catch (error) {
    console.error("Could not create notification:", error.message);
    return null;
  }
}

export async function notifyWorkshop(workshopId, payload) {
  return safeNotify({ ...payload, workshop: workshopId, recipient: null });
}

export async function notifyUser(recipientId, workshopId, payload) {
  return safeNotify({
    ...payload,
    workshop: workshopId,
    recipient: recipientId,
  });
}

export async function listNotifications(user, query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = scopeFor(user);

  if (query.type) {
    if (!TYPES.includes(query.type))
      throw new ApiError(400, "Invalid notification type");
    filter.type = query.type;
  }

  if (query.filter) {
    if (query.filter !== "unread") throw new ApiError(400, "Invalid filter");
    // "readBy no me contiene" se resuelve en la query, no en memoria: filtrar después del skip/limit haría que la paginación mintiera.
    filter.readBy = { $ne: user.id };
  }

  const [rows, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("recipient", "name email")
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      ...scopeFor(user),
      readBy: { $ne: user.id },
    }),
  ]);

  // El estado de lectura vive en `readBy`; se calcula acá para que el cliente no tenga que comparar ids en cada item.
  const items = rows.map((n) => ({
    ...n,
    read: n.readBy.some((id) => String(id) === String(user.id)),
  }));

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    unread,
  };
}

export async function getUnreadCount(user) {
  const unread = await Notification.countDocuments({
    ...scopeFor(user),
    readBy: { $ne: user.id },
  });
  return { unread };
}

async function getVisible(id, user) {
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid notification id");

  const notification = await Notification.findById(id);
  if (!notification) throw new ApiError(404, "Notification not found");
  if (!isVisible(notification, user)) throw new ApiError(403, "Forbidden");

  return notification;
}

// `readBy` es un array de ObjectId, que Mongoose modela como array de documentos: `addToSet` + `save()` no marcaba el cambio como sucio y la lectura se perdía. Con updateOne el $addToSet es atómico y además no hay carrera entre dos lecturas simultáneas del mismo aviso.
export async function markRead(id, user) {
  const notification = await getVisible(id, user);

  await Notification.updateOne(
    { _id: notification._id },
    { $addToSet: { readBy: user.id } },
  );

  notification.readBy.addToSet(user.id);
  return notification;
}

export async function markUnread(id, user) {
  const notification = await getVisible(id, user);

  await Notification.updateOne(
    { _id: notification._id },
    { $pull: { readBy: user.id } },
  );

  notification.readBy.pull(user.id);
  return notification;
}

export async function markAllRead(user) {
  const result = await Notification.updateMany(scopeFor(user), {
    $addToSet: { readBy: user.id },
  });

  return { updated: result.modifiedCount };
}
