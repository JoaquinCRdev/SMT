import cron from "node-cron";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import Notification from "../models/notification.model.js";

// Ventana por defecto, usada por los planes `custom` (y por cualquier
// frecuencia sin entrada en el mapa de abajo).
const LOOKAHEAD_DAYS = Number(process.env.NOTIFICATION_LOOKAHEAD_DAYS) || 3;

// Una ventana única para todas las frecuencias no Servía: un plan diario
// avisando con 3 días de anticipación es ruido (si no está vencido, su
// nextDue siempre cae dentro de la ventana, así que nunca distinguished
// "vence mañana" de "vence en tres días"), mientras que un plan anual
// necesitaría más margen para que haya tiempo de agendarlo. Ahora cada
// frecuencia avisa con su propia anticipación.
const LOOKAHEAD_BY_FREQUENCY = {
  daily: 1,
  weekly: 2,
  monthly: 5,
  yearly: 7,
};

function lookaheadFor(plan) {
  return LOOKAHEAD_BY_FREQUENCY[plan.frequency] ?? LOOKAHEAD_DAYS;
}

// La ventana más amplia de todas: define hasta dónde mira la consulta. Después
// cada plan se filtra por su propia ventana (más fina).
const MAX_LOOKAHEAD_DAYS = Math.max(
  LOOKAHEAD_DAYS,
  ...Object.values(LOOKAHEAD_BY_FREQUENCY),
);

// La zona del aviso. El cron usa la hora local de ESTA zona y la ventana se
// calcula en la misma, así no pueden desalinearse.
//
// Antes la hora la ponía el `TZ` del proceso y la ventana usaba UTC. En Buenos
// Aires eso casaba por casualidad (08:00 local = 11:00 UTC, mismo día), pero en
// cualquier zona UTC+ el cron dispara antes de medianoche UTC: un plan que
// vencía "hoy" se veía como "vence en 1 día". Con un contenedor en UTC el
// problema era el inverso: el aviso salía a las 05:00 para el usuario.
const NOTIFICATION_TIMEZONE =
  process.env.NOTIFICATION_TIMEZONE || "America/Buenos_Aires";

// 08:00 por defecto: el taller ya está abierto y el aviso es accionable.
// Ojo: node-cron interpreta la expresión en la zona del proceso salvo que se le
// pase `timezone`, así que abajo se la pasamos explícita.
const CRON_EXPRESSION = process.env.NOTIFICATION_CRON || "0 8 * * *";

// La medianoche del "hoy" del taller, expresada como instante UTC.
//
// `startDate` y `nextDue` se guardan como medianoche UTC (así los calculó el
// service), pero "hoy" para el usuario es el día en su calendario. Si el taller
// está en una zona ahead de UTC, la medianoche UTC de hoy todavía es "mañana" en
// su reloj, y comparar ambos sin corregir la fecha movía todo un día.
function startOfToday(now = new Date()) {
  // Se lee la fecha en la zona del taller y se vuelve a construir en UTC. Es la
  // forma de obtener "el UTC instant que representa la medianoche de ese día".
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: NOTIFICATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (tipo) => Number(partes.find((p) => p.type === tipo)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

function endOfWindow() {
  const end = startOfToday();
  end.setUTCDate(end.getUTCDate() + MAX_LOOKAHEAD_DAYS + 1);
  return end;
}

// La clave lleva la fecha exacta de vencimiento: si el plan se reprograma, la clave cambia y el aviso nuevo se crea igual.
function dedupeKeyFor(plan) {
  const d = new Date(plan.nextDue);
  const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return `due:${plan._id}:${iso}`;
}

function labelFor(plan) {
  const due = new Date(plan.nextDue);
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const sameDay = (a, b) =>
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();

  // Vencido: la corrida llega tarde (servidor caído, plan reprogramado) y el
  // plan ya pasó. Hay que decirlo distinto a "programado".
  if (due < today) {
    if (sameDay(due, yesterday())) return "venció ayer";

    const dias = Math.round((today - due) / 86_400_000);
    if (dias <= 30) return `hace ${dias} días`;

    return `venció el ${due.toLocaleDateString("es-AR", { timeZone: "UTC" })}`;
  }

  if (sameDay(due, today)) return "para hoy";
  if (sameDay(due, tomorrow)) return "para mañana";

  // Con ventanas por frecuencia el aviso puede caer a 2, 5 o 7 días: "para el
  // 12/10" obligaba a hacer la cuenta a mano.
  const dias = Math.round((due - today) / 86_400_000);
  if (dias <= 7) return `en ${dias} días`;

  return `para el ${due.toLocaleDateString("es-AR", { timeZone: "UTC" })}`;
}

function yesterday() {
  const d = startOfToday();
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

// Crea un aviso por cada plan activo vencido o que vence dentro de la ventana. Idempotente por `dedupeKey` (índice único), así que se puede correr todas las veces que se quiera sin duplicar.
export async function sweepDueMaintenance() {
  const from = startOfToday();
  const to = endOfWindow();

  // Sin cota inferior a propósito: un plan vencido igual tiene que avisar. Con
  // `$gte: from` caía para siempre fuera de la consulta, así que si el servidor
  // estaba caído el día del vencimiento el aviso se perdía sin remedio.
  //
  // `endDate` se guardaba pero no se leía en ningún lado; sin este filtro un
  // plan ya vencido en su fecha final volvería a avisar en cada corrida.
  const plans = await MaintenancePlan.find({
    status: "active",
    nextDue: { $lt: to },
    $or: [{ endDate: null }, { endDate: { $gte: from } }],
  })
    // `workshopId` viene en la proyección porque el aviso se ata al taller; sin él la notificación nace sin taller y queda invisible.
    .populate("machineId", "name workshopId")
    .lean();

  if (!plans.length) return { scanned: 0, created: 0 };

  // La consulta trajo todo lo que cabe en la ventana más amplia; cada plan
  // entra solo si cae dentro de la suya. Un plan vencido (nextDue < hoy) pasa
  // siempre, sea cual sea su frecuencia.
  const enVentana = plans.filter((plan) => {
    const due = new Date(plan.nextDue);
    if (due < from) return true;

    const limite = new Date(from);
    limite.setUTCDate(limite.getUTCDate() + lookaheadFor(plan));
    return due <= limite;
  });

  // `scanned` cuenta los que realmente se evaluaron, no los que trajo la
  // consulta: con ventanas por frecuencia la consulta devuelve de más, y un
  // log que dice "scanned: 2" con un solo aviso creado no dice nada.
  const operations = enVentana
    .map((plan) => {
      const machine = plan.machineId;
      const vencido = new Date(plan.nextDue) < from;
      const body = {
        workshop: machine?.workshopId,
        recipient: null,
        type: "mantenimiento",
        title: plan.title,
        message: vencido
          ? `El mantenimiento de ${machine?.name || "una máquina"} ${labelFor(plan)}.`
          : `El mantenimiento de ${machine?.name || "una máquina"} está programado ${labelFor(plan)}.`,
        link: "/mantenimiento",
        readBy: [],
        dedupeKey: dedupeKeyFor(plan),
        meta: {
          planId: String(plan._id),
          machineId: String(machine?._id),
          nextDue: plan.nextDue,
        },
      };

      if (!body.workshop) {
        // Plan huérfano: sin taller no hay a quién avisarle.
        return null;
      }

      return {
        // $setOnInsert: si el aviso ya existe no se toca, así un re-run del cron no pisa un `readBy` que el usuario ya diligenció.
        updateOne: {
          filter: { dedupeKey: body.dedupeKey },
          update: { $setOnInsert: body },
          upsert: true,
        },
      };
    })
    .filter(Boolean);

  if (!operations.length) return { scanned: 0, created: 0 };

  const result = await Notification.bulkWrite(operations);

  return { scanned: enVentana.length, created: result.upsertedCount };
}

let started = false;

export function startNotificationJobs() {
  if (started) return;
  if (process.env.NODE_ENV === "test") return;

  if (!cron.validate(CRON_EXPRESSION)) {
    console.error(`Invalid NOTIFICATION_CRON: ${CRON_EXPRESSION}`);
    return;
  }

  started = true;

  // Una pasada al arrancar. El cron solo corre a las 08:00 (en la zona del taller): si el servidor se levantó más tarde, o la máquina estaba apagada ese día, la ventana de ese día ya se había cerrado. Es idempotente por `dedupeKey`, así que no pisa los `readBy` que el usuario ya diligenció.
  (async () => {
    try {
      const { scanned, created } = await sweepDueMaintenance();
      console.log(
        `[notifications] startup due sweep: ${scanned} plans, ${created} created`,
      );
    } catch (error) {
      console.error("[notifications] startup due sweep failed:", error.message);
    }
  })();

  cron.schedule(
    CRON_EXPRESSION,
    async () => {
      try {
        const { scanned, created } = await sweepDueMaintenance();
        console.log(
          `[notifications] due sweep: ${scanned} plans in window, ${created} created`,
        );
      } catch (error) {
        console.error("[notifications] due sweep failed:", error.message);
      }
    },
    // Sin esto node-cron usaría el `TZ` del proceso y la hora del aviso dejaría de coincidir con la ventana calculada en NOTIFICATION_TIMEZONE.
    { timezone: NOTIFICATION_TIMEZONE },
  );

  console.log(
    `[notifications] scheduled "${CRON_EXPRESSION}" in ${NOTIFICATION_TIMEZONE}`,
  );
}
