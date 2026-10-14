import { useCallback, useEffect, useState } from "react";
import "../styles/pages/notificaciones.css";
import api from "../api/axios";
import Sidebar from "../components/layout/sidebar";
import { useNotificationBadge } from "../context/notificationContext";

// El backend devuelve type: "mantenimiento" | "taller" | "sistema". El CSS ya tenía factura/cliente/mantenimiento/sistema/pago; `taller` se agregó para los avisos de ingresos.
const ICONOS = {
  mantenimiento: { icono: "🔧", clase: "notificacion-icono mantenimiento" },
  taller: { icono: "👥", clase: "notificacion-icono taller" },
  sistema: { icono: "ⓘ", clase: "notificacion-icono sistema" },
};

const DESCONOCIDO = { icono: "•", clase: "notificacion-icono" };

// La página no tiene paginación, así que el conjuntotraído es el conjunto visible completo y filtrar acá es correcto. Los filtros del server (?filter=unread, ?type=) quedan disponibles para cuando haya paginación.
function formatearFecha(iso) {
  if (!iso) return "";

  const fecha = new Date(iso);
  const ahora = new Date();

  const hora = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mismoDia = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);

  if (mismoDia(fecha, ahora)) return `Hoy, ${hora}`;
  if (mismoDia(fecha, ayer)) return `Ayer, ${hora}`;

  return `${fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}, ${hora}`;
}

// La API habla inglés (title/message/readBy); la página ya estaba escrita con los nombres en español, así que se normaliza una sola vez acá.
function normalizar(notificacion) {
  const tipo = ICONOS[notificacion.type] ? notificacion.type : null;

  return {
    id: notificacion._id,
    tipo,
    titulo: notificacion.title,
    descripcion: notificacion.message,
    fecha: formatearFecha(notificacion.createdAt),
    leida: notificacion.read === true,
    link: notificacion.link,
  };
}

const Notificaciones = () => {
  const [filtro, setFiltro] = useState("todas");

  const [notificaciones, setNotificaciones] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // La campana del sidebar es la misma fuente de verdad: sin esto marcás acá y el número queda desactualizado hasta recargar.
  const { refrescarConteo } = useNotificationBadge();

  const cargarDatos = useCallback(async ({ limpiarError = true } = {}) => {
    if (limpiarError) setError("");

    try {
      const res = await api.get("/notifications", { params: { limit: 100 } });
      setNotificaciones((res.data.items ?? []).map(normalizar));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudieron cargar las notificaciones",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await api.get("/notifications", {
          params: { limit: 100 },
        });
        if (cancelado) return;
        setNotificaciones((res.data.items ?? []).map(normalizar));
      } catch (err) {
        if (cancelado) return;
        setError(
          err.response?.data?.message ||
            "No se pudieron cargar las notificaciones",
        );
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const marcarTodasLeidas = async () => {
    try {
      await api.patch("/notifications/read-all");
      await Promise.all([cargarDatos(), refrescarConteo()]);
    } catch (err) {
      setError(
        err.response?.data?.message || "No se pudieron marcar como leídas",
      );
    }
  };

  const marcarComoLeida = async (id) => {
    // Optimista: la interfaz responde al instante y se revierte si falla.
    setNotificaciones((actuales) =>
      actuales.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );

    try {
      await api.patch(`/notifications/${id}/read`);
      refrescarConteo();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo marcar como leída");
      await cargarDatos({ limpiarError: false });
    }
  };

  const marcarComoNoLeida = async (id) => {
    setNotificaciones((actuales) =>
      actuales.map((n) => (n.id === id ? { ...n, leida: false } : n)),
    );

    try {
      await api.patch(`/notifications/${id}/unread`);
      refrescarConteo();
    } catch (err) {
      setError(
        err.response?.data?.message || "No se pudo marcar como no leída",
      );
      await cargarDatos({ limpiarError: false });
    }
  };

  const filtrarNotificaciones = () => {
    switch (filtro) {
      case "no-leidas":
        return notificaciones.filter((n) => !n.leida);

      case "taller":
        return notificaciones.filter((n) => n.tipo === "taller");

      default:
        return notificaciones;
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const notificacionesFiltradas = filtrarNotificaciones();

  return (
    <div className="containernotificaciones">
      <Sidebar />
      <div className="notificaciones-container">
        {/* ENCABEZADO */}
        <div className="notificaciones-header">
          <div>
            <h1>Notificaciones</h1>

            <p>Enterate de las últimas novedades y actividades del sistema.</p>
          </div>

          <button
            className="btn-marcar-leidas"
            onClick={marcarTodasLeidas}
            disabled={noLeidas === 0}
          >
            ✓ Marcar todas como leídas
          </button>
        </div>

        {/* FILTROS */}
        <div className="notificaciones-filtros">
          <button
            className={filtro === "todas" ? "filtro activo" : "filtro"}
            onClick={() => setFiltro("todas")}
          >
            Todas
            <span>{notificaciones.length}</span>
          </button>

          <button
            className={filtro === "no-leidas" ? "filtro activo" : "filtro"}
            onClick={() => setFiltro("no-leidas")}
          >
            No leídas
            <span className="contador-rojo">{noLeidas}</span>
          </button>

          <button
            className={filtro === "taller" ? "filtro activo" : "filtro"}
            onClick={() => setFiltro("taller")}
          >
            Taller
            <span>
              {notificaciones.filter((n) => n.tipo === "taller").length}
            </span>
          </button>
        </div>

        {/* LISTA DE NOTIFICACIONES */}
        <div className="notificaciones-lista">
          {cargando ? (
            <div className="sin-notificaciones">
              <div className="sin-notificaciones-icono">…</div>

              <h3>Cargando notificaciones</h3>
            </div>
          ) : error ? (
            <div className="sin-notificaciones">
              <div className="sin-notificaciones-icono">!</div>

              <h3>No pudimos cargar las notificaciones</h3>

              <p>{error}</p>
            </div>
          ) : notificacionesFiltradas.length === 0 ? (
            <div className="sin-notificaciones">
              <div className="sin-notificaciones-icono">✓</div>

              <h3>No hay notificaciones</h3>

              <p>No tenés notificaciones para mostrar en este momento.</p>
            </div>
          ) : (
            notificacionesFiltradas.map((notificacion) => (
              <div
                key={notificacion.id}
                className={
                  notificacion.leida
                    ? "notificacion-item"
                    : "notificacion-item no-leida"
                }
                onClick={() => {
                  // Click en la fila: sólo marca como leída. El toggle de vuelta atrás queda en el botón ⋯, para no sorprender.
                  if (!notificacion.leida) marcarComoLeida(notificacion.id);
                }}
              >
                {/* ICONO */}
                <div
                  className={(ICONOS[notificacion.tipo] || DESCONOCIDO).clase}
                >
                  {(ICONOS[notificacion.tipo] || DESCONOCIDO).icono}
                </div>

                {/* INFORMACIÓN */}
                <div className="notificacion-contenido">
                  <div className="notificacion-titulo">
                    <h3>{notificacion.titulo}</h3>

                    {!notificacion.leida && (
                      <span className="punto-no-leida"></span>
                    )}
                  </div>

                  <p>{notificacion.descripcion}</p>
                </div>

                {/* FECHA */}
                <span className="notificacion-fecha">{notificacion.fecha}</span>

                {/* OPCIONES */}
                <button
                  className="notificacion-opciones"
                  title={
                    notificacion.leida
                      ? "Marcar como no leída"
                      : "Marcar como leída"
                  }
                  onClick={(e) => {
                    e.stopPropagation();

                    if (notificacion.leida) {
                      marcarComoNoLeida(notificacion.id);
                    } else {
                      marcarComoLeida(notificacion.id);
                    }
                  }}
                >
                  ⋯
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;
