import mongoose from "mongoose";

// Una fila por evento, no una fila por destinatario: el estado de lectura vive en `readBy`. `recipient` solo se usa para avisos dirigidos a una persona puntual (p. ej. el dueño del taller); cuando es null el aviso es para todo el taller.
const notificationSchema = new mongoose.Schema(
  {
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["mantenimiento", "taller", "sistema"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, "Title must be at most 120 characters long"],
    },
    message: {
      type: String,
      maxlength: [500, "Message must be at most 500 characters long"],
    },
    // Ruta del cliente a la que apunta el aviso (p. ej. /mantenimiento).
    link: {
      type: String,
      maxlength: [200, "Link must be at most 200 characters long"],
    },
    readBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    // Clave de idempotencia: permite que el cron se repita (o corra en varias instancias) sin duplicar el mismo aviso. Se deja en null cuando no aplica (avisos dirigidos a una persona, no del cron).
    dedupeKey: {
      type: String,
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

notificationSchema.index({ workshop: 1, createdAt: -1 });
// El índice solo mira los dedupeKey que son strings: los avisos con la clave en null (no idempotentes) quedan fuera y pueden convivir. Con `sparse` no alcanzaba, porque el campo siempre está presente.
notificationSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
