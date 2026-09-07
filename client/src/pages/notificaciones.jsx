import { useState } from "react";
import "../styles/pages/notificaciones.css";
import Sidebar from "../components/layout/sidebar";

const Notificaciones = () => {
  const [filtro, setFiltro] = useState("todas");

  const [notificaciones, setNotificaciones] = useState([
    {
      id: 1,
      tipo: "mantenimiento",
      titulo: "Mantenimiento programado",
      descripcion: "El mantenimiento de la máquina #3 está programado para mañana.",
      fecha: "Ayer, 16:30",
      leida: false,
    },
    {
      id: 2,
      tipo: "sistema",
      titulo: "Actualización del sistema",
      descripcion: "Se ha instalado una nueva versión del sistema.",
      fecha: "Ayer, 12:10",
      leida: true,
    },
    {
      id: 3,
      tipo: "sistema",
      titulo: "Copia de seguridad completada",
      descripcion: "La copia de seguridad del sistema se realizó correctamente.",
      fecha: "09/08/2026, 03:15",
      leida: true,
    },
  ]);

  const marcarTodasLeidas = () => {
    setNotificaciones(
      notificaciones.map((notificacion) => ({
        ...notificacion,
        leida: true,
      }))
    );
  };

  const marcarComoLeida = (id) => {
    setNotificaciones(
      notificaciones.map((notificacion) =>
        notificacion.id === id
          ? { ...notificacion, leida: true }
          : notificacion
      )
    );
  };

  const filtrarNotificaciones = () => {
    switch (filtro) {
      case "no-leidas":
        return notificaciones.filter((n) => !n.leida);

      case "sistema":
        return notificaciones.filter((n) => n.tipo === "sistema");

      default:
        return notificaciones;
    }
  };

  const obtenerIcono = (tipo) => {
    switch (tipo) {
      case "mantenimiento":
        return "🔧";

      case "sistema":
        return "ⓘ";

      default:
        return "•";
    }
  };

  const obtenerClaseIcono = (tipo) => {
    switch (tipo) {
      case "mantenimiento":
        return "notificacion-icono mantenimiento";

      case "sistema":
        return "notificacion-icono sistema";

      default:
        return "notificacion-icono";
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

          <p>
            Enterate de las últimas novedades y actividades del sistema.
          </p>
        </div>

        <button
          className="btn-marcar-leidas"
          onClick={marcarTodasLeidas}
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
          className={
            filtro === "no-leidas" ? "filtro activo" : "filtro"
          }
          onClick={() => setFiltro("no-leidas")}
        >
          No leídas
          <span className="contador-rojo">{noLeidas}</span>
        </button>

        <button
          className={
            filtro === "sistema" ? "filtro activo" : "filtro"
          }
          onClick={() => setFiltro("sistema")}
        >
          Sistema
          <span>
            {notificaciones.filter((n) => n.tipo === "sistema").length}
          </span>
        </button>

      </div>


      {/* LISTA DE NOTIFICACIONES */}
      <div className="notificaciones-lista">

        {notificacionesFiltradas.length === 0 ? (

          <div className="sin-notificaciones">
            <div className="sin-notificaciones-icono">
              ✓
            </div>

            <h3>No hay notificaciones</h3>

            <p>
              No tenés notificaciones para mostrar en este momento.
            </p>
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
              onClick={() => marcarComoLeida(notificacion.id)}
            >

              {/* ICONO */}
              <div className={obtenerClaseIcono(notificacion.tipo)}>
                {obtenerIcono(notificacion.tipo)}
              </div>


              {/* INFORMACIÓN */}
              <div className="notificacion-contenido">

                <div className="notificacion-titulo">

                  <h3>
                    {notificacion.titulo}
                  </h3>

                  {!notificacion.leida && (
                    <span className="punto-no-leida"></span>
                  )}

                </div>

                <p>
                  {notificacion.descripcion}
                </p>

              </div>


              {/* FECHA */}
              <span className="notificacion-fecha">
                {notificacion.fecha}
              </span>


              {/* OPCIONES */}
              <button
                className="notificacion-opciones"
                onClick={(e) => e.stopPropagation()}
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