import { startOfToday } from "./dates.js";

// Ventana por defecto, usada por los planes `custom` (y por cualquier
// frecuencia sin entrada en el mapa de abajo).
const LOOKAHEAD_DAYS = Number(process.env.NOTIFICATION_LOOKAHEAD_DAYS) || 3;

// Una ventana única para todas las frecuencias no servía: un plan diario
// avisando con 3 días de anticipación es ruido (si no está vencido, su nextDue
// siempre cae dentro de la ventana, así que nunca distinguía "vence mañana" de
// "vence en tres días"), mientras que un plan anual necesitaría más margen para
// que haya tiempo de agendarlo. Cada frecuencia avisa con su propia anticipación.
const LOOKAHEAD_BY_FREQUENCY = {
  daily: 1,
  weekly: 2,
  monthly: 5,
  yearly: 7,
};

export function lookaheadFor(plan) {
  return LOOKAHEAD_BY_FREQUENCY[plan.frequency] ?? LOOKAHEAD_DAYS;
}

// La ventana más amplia de todas: define hasta dónde mira la consulta. Después
// cada plan se filtra por su propia ventana (más fina).
export const MAX_LOOKAHEAD_DAYS = Math.max(
  LOOKAHEAD_DAYS,
  ...Object.values(LOOKAHEAD_BY_FREQUENCY),
);

export function endOfWindow() {
  const end = startOfToday();
  end.setUTCDate(end.getUTCDate() + MAX_LOOKAHEAD_DAYS + 1);
  return end;
}

const DAY_MS = 86_400_000;

// Clasifica un plan según su vencimiento. Devuelve el estado y los días de
// diferencia (positivo = ya vencido, negativo = todavía falta), sin formatear
// texto: el mismo cálculo alimenta el aviso del cron (que guarda un mensaje en
// español) y el resumen del home (que se traduce en el cliente).
//
// `nextDue` se guarda como medianoche UTC y `hoy` es la medianoche del taller,
// así que ambos son comparables directamente.
export function dueInfo(nextDue, hoy = startOfToday()) {
  const due = new Date(nextDue);
  const diff = Math.round((hoy - due) / DAY_MS);

  return {
    vencido: due < hoy,
    // Días hasta el vencimiento: 0 = hoy, 1 = mañana, -2 = hace dos días.
    dias: -diff,
  };
}

// Un plan entra en la ventana si ya venció (siempre avisa) o si vence dentro de
// la anticipación de su propia frecuencia.
export function isWithinDueWindow(plan, hoy = startOfToday()) {
  const due = new Date(plan.nextDue);
  if (due < hoy) return true;

  const limite = new Date(hoy);
  limite.setUTCDate(limite.getUTCDate() + lookaheadFor(plan));
  return due <= limite;
}
