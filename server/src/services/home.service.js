import Machine from "../models/machine.model.js";
import MaintenancePlan from "../models/maintenancePlan.model.js";
import User from "../models/user.model.js";
import { listNotifications } from "./notification.service.js";
import { requireWorkshop } from "../utils/access.js";
import { startOfToday } from "../utils/dates.js";
import { isWithinDueWindow } from "../utils/maintenanceDue.js";

// Cuántos avisos recientes muestra el resumen del home.
const RECENT_NOTIFICATIONS = 2;

const MACHINE_PROJECTION = "name tipo status";

function planToUrgent(plan, hoy) {
  const nextDue = new Date(plan.nextDue);
  const endDate = plan.endDate ? new Date(plan.endDate) : null;
  const endDatePassed = endDate && endDate < hoy;

  // El estado y la fecha siguen la misma regla que el historial: un plan con
  // `endDate` ya pasado cuenta como vencido y se fecha con ese día; si no, manda
  // `nextDue`.
  const vencido = endDatePassed || nextDue < hoy;
  const fecha = endDatePassed ? endDate : nextDue;

  const dias = Math.round((hoy - fecha) / 86_400_000);

  return {
    id: String(plan._id),
    machine: plan.machineId
      ? { _id: String(plan.machineId._id), name: plan.machineId.name }
      : null,
    title: plan.title,
    // Valores planos; el cliente decide la etiqueta traducida. Positivo en
    // `dias` = vencido hace N días; negativo = vence en N días.
    estado: vencido ? "vencido" : "proximo",
    dias,
    fecha: fecha.toISOString().slice(0, 10),
  };
}

export async function getHome(user) {
  const workshopId = requireWorkshop(user);
  const hoy = startOfToday();

  // Todo lo que sigue se acota al taller del usuario: es la garantía de que el
  // resumen no filtra nada de otro taller.
  const machines = await Machine.find({ workshopId })
    .select(MACHINE_PROJECTION)
    .lean();

  // Los planes no guardan `workshopId`: se acotan por las máquinas del taller,
  // igual que en history.service y maintenancePlan.service.
  const machineIds = machines.map((m) => m._id);

  const [planes, personal, notificaciones] = await Promise.all([
    MaintenancePlan.find({ status: "active", machineId: { $in: machineIds } })
      .populate("machineId", MACHINE_PROJECTION)
      .lean(),
    User.countDocuments({ workshop: workshopId }),
    listNotifications(user, { limit: String(RECENT_NOTIFICATIONS) }),
  ]);

  const maquinas = machines.filter((m) => m.tipo === "maquina").length;
  const otros = machines.length - maquinas;

  // Urgentes = planes que ya vencieron o que caen dentro de la anticipación de
  // su frecuencia (la misma ventana que dispara el aviso del cron), ordenados
  // por los más atrasados primero.
  //
  // Ojo: además de la ventana se cuenta un plan cuyo `endDate` ya pasó, aunque
  // su `nextDue` sea futuro. El cron excluye a propósito esos casos (para no
  // volver a avisar de un plan ya cerrado), pero acá sí son "necesita
  // atención": es la misma regla que usa el historial para marcarlos vencidos.
  const mantenimientosUrgentes = planes
    .filter(
      (plan) =>
        isWithinDueWindow(plan, hoy) ||
        (plan.endDate && new Date(plan.endDate) < hoy),
    )
    .map((plan) => planToUrgent(plan, hoy))
    .sort((a, b) => b.dias - a.dias);

  return {
    resumen: {
      maquinas,
      otros,
      mantenimientosActivos: planes.length,
      personal,
    },
    mantenimientosUrgentes,
    notificacionesRecientes: notificaciones.items.map((n) => ({
      _id: String(n._id),
      title: n.title,
      message: n.message || "",
      type: n.type,
      link: n.link || "",
      read: n.read,
      createdAt: n.createdAt,
    })),
  };
}
