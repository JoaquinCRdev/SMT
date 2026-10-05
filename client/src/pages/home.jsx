import "../styles/pages/home.css";
import { Link, NavLink } from "react-router-dom";
import Sidebar from "../components/layout/sidebar";

// ============================================================
// DATOS DE MUESTRA
// Estas páginas (Mis máquinas, Mantenimientos, Configuración,
// Notificaciones) todavía no comparten un mismo backend de
// "resumen", así que por ahora estos números y listas son
// mock, pensados para que coincidan con lo que ya se ve en
// cada página. Cuando haya un endpoint de resumen (o varios
// endpoints que consultemos acá), esto se reemplaza por fetchs
// reales, tal como ya hace mismaquinas.jsx con api.get("/machine").
// ============================================================

const resumen = {
  maquinas: 5,
  otros: 11,
  mantenimientosActivos: 3,
  personal: 8,
};

const mantenimientosUrgentes = [
  {
    id: 1,
    maquina: "Generador B",
    tipo: "Predictivo",
    estado: "vencido",
    detalle: "Vencido hace 12 días",
  },
  {
    id: 2,
    maquina: "Pinacho Mustang 225",
    tipo: "Mantenimiento Trimestral",
    estado: "vencido",
    detalle: "Vencido hace 3 días",
  },
  {
    id: 3,
    maquina: "Bomba de Agua",
    tipo: "Preventivo",
    estado: "proximo",
    detalle: "Vence en 2 días",
  },
];

// Últimos mantenimientos registrados (máquinas y tipos tomados
// de mantenimiento.jsx). Cuando "Mantenimientos" tenga su propio
// historial con fechas reales, acá se consultarían los últimos 5
// que devuelva el backend en vez de este array fijo.
const ultimosMantenimientos = [
  {
    id: 1,
    maquina: "Pinacho Mustang 225",
    tipo: "Mantenimiento Trimestral",
    fecha: "28/09/2026",
    estado: "realizado",
  },
  {
    id: 2,
    maquina: "Torno CNC HAAS",
    tipo: "Mantenimiento Mensual",
    fecha: "25/09/2026",
    estado: "pendiente",
  },
  {
    id: 3,
    maquina: "Fresadora Bridgeport",
    tipo: "Mantenimiento Semanal",
    fecha: "22/09/2026",
    estado: "realizado",
  },
  {
    id: 4,
    maquina: "Compresor Atlas",
    tipo: "Cambio de filtros",
    fecha: "18/09/2026",
    estado: "pendiente",
  },
  {
    id: 5,
    maquina: "Pinacho Mustang 225",
    tipo: "Lubricación",
    fecha: "15/09/2026",
    estado: "realizado",
  },
];

const notificacionesRecientes = [
  {
    id: 1,
    titulo: "Mantenimiento programado",
    fecha: "Ayer, 16:30",
    leida: false,
  },
  {
    id: 2,
    titulo: "Actualización del sistema",
    fecha: "Ayer, 12:10",
    leida: true,
  },
];

const Home = () => {
  return (
    <div id="containerhome">
      <Sidebar />
      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div id="ladohome">
        {/* ================= BARRA SUPERIOR (sin cambios) ================= */}
        <div id="botonesarribahome">
          <button className="notification-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <div className="separadorheader"></div>

          <div className="user-profile">
            <div className="avatar-circle">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div className="user-info">
              <span className="user-name">Administrador</span>
              <span className="user-role">Admin</span>
            </div>
          </div>
        </div>

        {/* ================= CONTENIDO HOME ================= */}
        <div id="contenidohome">
          {/* COLUMNA PRINCIPAL */}
          <main id="columnaprincipalhome">
            {/* BIENVENIDA (sin cambios) */}
            <div id="bienvenidahome">
              <div className="iconobienvenida">
                <img src="personita.png" alt="" />
              </div>

              <div>
                <h1>¡Hola, Administrador!</h1>
                <p>Bienvenido de nuevo</p>
              </div>
            </div>

            {/* RESUMEN GENERAL */}
            <section id="resumengeneral">
              <h2>Resumen general</h2>

              <div id="tarjetasresumen">
                {/* MAQUINAS */}
                <Link to="/mismaquinas" className="tarjetaresumen">
                  <div>
                    <p>Máquinas</p>
                    <strong>{resumen.maquinas}</strong>
                    <span>Registradas</span>
                  </div>

                  <img src="mismaquinasnaranja.png" alt="" />
                </Link>

                {/* OTROS */}
                <Link to="/mismaquinas" className="tarjetaresumen">
                  <div>
                    <p>Otros</p>
                    <strong>{resumen.otros}</strong>
                    <span>Registrados</span>
                  </div>

                  <img src="mismaquinasnaranja.png" alt="" />
                </Link>

                {/* MANTENIMIENTOS */}
                <Link to="/mantenimientos" className="tarjetaresumen">
                  <div>
                    <p>Mantenimientos</p>
                    <strong>{resumen.mantenimientosActivos}</strong>
                    <span>Activos</span>
                  </div>

                  <img src="mantenimientosnaranja.png" alt="" />
                </Link>

                {/* PERSONAL */}
                <Link to="/configuracion" className="tarjetaresumen">
                  <div>
                    <p>Personal</p>
                    <strong>{resumen.personal}</strong>
                    <span>Miembros</span>
                  </div>

                  <img src="iconopersonal.png" alt="" />
                </Link>
              </div>
            </section>

            {/* MANTENIMIENTOS QUE NECESITAN ATENCIÓN + ÚLTIMOS MANTENIMIENTOS, lado a lado */}
            <div id="filasegundaresumenhome">
              <section id="mantenimientosAtencionHome" className="tarjetaseccionhome">
                <div className="encabezado-seccion-home">
                  <h2>Mantenimientos que necesitan atención</h2>
                  <Link to="/historial">Ver todos</Link>
                </div>

                <div id="listaatencionhome">
                  {mantenimientosUrgentes.map((item) => (
                    <div className="filaatencionhome" key={item.id}>
                      <div>
                        <strong>{item.maquina}</strong>
                        <span>{item.tipo}</span>
                      </div>

                      <span className={`estado-atencion ${item.estado}`}>
                        {item.detalle}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section id="ultimosmantenimientoshome" className="tarjetaseccionhome">
                <div className="encabezado-seccion-home">
                  <h2>Últimos mantenimientos</h2>
                  <Link to="/mantenimientos">Ver todos</Link>
                </div>

                <div id="listaultimosmantenimientoshome">
                  {ultimosMantenimientos.slice(0, 5).map((item) => (
                    <div className="filamantenimientohome" key={item.id}>
                      <div>
                        <strong>{item.maquina}</strong>
                        <span className="tipo-mantenimiento">{item.tipo}</span>
                      </div>

                      <div className="info-derecha">
                        <span className="fecha-mantenimiento">{item.fecha}</span>
                        <span className={`estado-mini ${item.estado}`}>
                          {item.estado === "realizado" ? "Realizado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* BANNER DE PLANES */}
            <section id="bannerplanhome">
              <div>
                <h2>Hechá un vistazo a nuestros planes</h2>
                <p>Descubrí todo lo que podés desbloquear con SMT Pro.</p>
              </div>

              <Link to="/planes" id="botonverplanhome">
                Planes
              </Link>
            </section>
          </main>

          {/* ================= ACCIONES RAPIDAS + NOTIFICACIONES ================= */}
          <aside id="accionesrapidas">
            <h2>Acciones rápidas</h2>

            <NavLink to="/mantenimientos" className="accionrapida">
              <div className="iconoaccion">
                <img src="nuevaorden.png" alt="" />
              </div>
              <span>Nueva orden</span>
            </NavLink>

            <NavLink to="/mismaquinas" className="accionrapida">
              <div className="iconoaccion">
                <img src="mismaquinasnaranja.png" alt="" />
              </div>
              <span>
                Registrar
                <br />
                máquina
              </span>
            </NavLink>

            <NavLink to="/configuracion" className="accionrapida">
              <div className="iconoaccion">
                <img src="iconopersonal.png" alt="" />
              </div>
              <span>
                Agregar
                <br />
                personal
              </span>
            </NavLink>

            <NavLink to="/historial" className="accionrapida">
              <div className="iconoaccion">
                <img src="reportesnaranja.png" alt="" />
              </div>
              <span>
                Ver
                <br />
                reportes
              </span>
            </NavLink>

            {/* NOTIFICACIONES RECIENTES */}
            <div id="notificacionesresumenhome">
              <div className="encabezado-seccion-home">
                <h2>Notificaciones</h2>
                <Link to="/notificaciones">Ver todas</Link>
              </div>

              {notificacionesRecientes.map((notif) => (
                <div
                  className={`notifhome ${notif.leida ? "" : "no-leida"}`}
                  key={notif.id}
                >
                  <span className="notifhome-titulo">{notif.titulo}</span>
                  <span className="notifhome-fecha">{notif.fecha}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;