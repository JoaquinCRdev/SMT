const DEFAULT_NOTIFICATION_TIMEZONE = "America/Buenos_Aires";

export const NOTIFICATION_TIMEZONE =
  process.env.NOTIFICATION_TIMEZONE || DEFAULT_NOTIFICATION_TIMEZONE;

// La medianoche del "hoy" del taller, expresada como instante UTC.
//
// `startDate` y `nextDue` se guardan como medianoche UTC (así los calculó el
// service), pero "hoy" para el usuario es el día en su calendario. Si el taller
// está en una zona ahead de UTC, la medianoche UTC de hoy todavía es "mañana" en
// su reloj, y comparar ambos sin corregir la fecha movía todo un día.
//
// La zona se lee por parámetro (con fallback al env) para que se pueda probar
// con cualquier timezone sin tocar variables de entorno.
export function startOfToday(
  now = new Date(),
  timeZone = process.env.NOTIFICATION_TIMEZONE || DEFAULT_NOTIFICATION_TIMEZONE,
) {
  // Se lee la fecha en la zona del taller y se vuelve a construir en UTC. Es la
  // forma de obtener "el UTC instant que representa la medianoche de ese día".
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (tipo) => Number(partes.find((p) => p.type === tipo)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}