import "../styles/pages/home.css";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Sidebar from "../components/layout/sidebar";
import i18n from "../i18n/i18n";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ULTIMOS_LIMIT = 5;

// "Hola, Administrador" sin duplicar la lógica: el nombre viene del perfil.
function primerNombre(name) {
  return (name || "").trim().split(/\s+/)[0];
}

// La fecha del aviso se muestra relativa ("Ayer, 16:30") y se traduce.
function fechaNotificacion(iso) {
  const fecha = new Date(iso);
  const hora = fecha.toLocaleTimeString(i18n.language || "es", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hoy = new Date();
  const mismoDia = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (mismoDia(fecha, hoy)) {
    return i18n.t("pages.home.notificaciones.fecha.hoy", { hora });
  }

  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  if (mismoDia(fecha, ayer)) {
    return i18n.t("pages.home.notificaciones.fecha.ayer", { hora });
  }

  return i18n.t("pages.home.notificaciones.fecha.fecha", {
    fecha: fecha.toLocaleDateString(i18n.language || "es", {
      day: "2-digit",
      month: "2-digit",
    }),
    hora,
  });
}

// Etiqueta de urgencia a partir de los datos del endpoint (estado + días).
// El backend manda valores planos; acá se traducen.
function etiquetaUrgencia({ estado, dias }) {
  const vencido = estado === "vencido";
  const abs = Math.abs(dias);

  if (abs === 0) {
    return i18n.t(vencido ? "pages.home.atencion.vencido_hoy" : "pages.home.atencion.vence_hoy");
  }

  const clave = vencido ? "vencido_hace" : "vence_en";
  return i18n.t(`pages.home.atencion.${clave}`, { count: abs });
}

function estadoSlug(estado) {
  return String(estado).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const Home = () => {
  const { user } = useAuth();

  const [resumen, setResumen] = useState(null);
  const [urgentes, setUrgentes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [ultimos, setUltimos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Si cambia el idioma hay que reformatear fechas y etiquetas.
  const [, setTickIdioma] = useState(0);
  useEffect(() => {
    const alCambiarIdioma = () => setTickIdioma((n) => n + 1);
    i18n.on("languageChanged", alCambiarIdioma);
    return () => i18n.off("languageChanged", alCambiarIdioma);
  }, []);

  useEffect(() => {
    let cancelado = false;

    // IIFE para no setStatear sincrónicamente en el cuerpo del effect (mismo
    // patrón que AuthContext/SolicitudesSection).
    (async () => {
      try {
        // Dos consultas en paralelo: el resumen y los últimos mantenimientos
        // (que reusan /api/history en vez de duplicar la lógica acá).
        const [home, historial] = await Promise.all([
          api.get("/home"),
          api.get("/history", {
            params: { state: "realizado", order: "recientes", limit: ULTIMOS_LIMIT },
          }),
        ]);

        if (cancelado) return;

        setResumen(home.data.resumen);
        setUrgentes(home.data.mantenimientosUrgentes || []);
        setNotificaciones(home.data.notificacionesRecientes || []);
        setUltimos(historial.data.items || []);
        setError("");
      } catch {
        if (cancelado) return;
        setError(i18n.t("pages.home.error"));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const nombre = primerNombre(user?.name);
  const esAdmin = user?.role === "admin";

  return (
    <div id="containerhome">
      <Sidebar />
      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div id="ladohome">
        {/* ================= BARRA SUPERIOR ================= */}
        <div id="botonesarribahome">
          <Link to="/notificaciones" className="notification-btn">
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
          </Link>

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
              <span className="user-name">{user?.name || ""}</span>
              <span className="user-role">
                {i18n.t(
                  esAdmin ? "pages.home.rol_admin" : "pages.home.rol_personal",
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ================= CONTENIDO HOME ================= */}
        <div id="contenidohome">
          {/* COLUMNA PRINCIPAL */}
          <main id="columnaprincipalhome">
            {/* BIENVENIDA */}
            <div id="bienvenidahome">
              <div className="iconobienvenida">
                <img src="personita.png" alt="" />
              </div>

              <div>
                <h1>
                  {i18n.t("pages.home.bienvenidaH1")}
                  {nombre ? `, ${nombre}` : ""}!
                </h1>
                <p>{i18n.t("pages.home.bienvenidaP")}</p>
              </div>
            </div>

            {/* RESUMEN GENERAL */}
            <section id="resumengeneral">
              <h2>{i18n.t("pages.home.resumen.titulo")}</h2>

              {cargando ? (
                <p className="home-vacio">{i18n.t("pages.home.cargando")}</p>
              ) : error ? (
                <p className="home-vacio">{error}</p>
              ) : (
                <div id="tarjetasresumen">
                  {/* MAQUINAS */}
                  <Link to="/mismaquinas" className="tarjetaresumen">
                    <div>
                      <p>{i18n.t("pages.home.resumen.maquinas")}</p>
                      <strong>{resumen.maquinas}</strong>
                      <span>{i18n.t("pages.home.resumen.registradas")}</span>
                    </div>

                    <img src="mismaquinasnaranja.png" alt="" />
                  </Link>

                  {/* OTROS */}
                  <Link to="/mismaquinas" className="tarjetaresumen">
                    <div>
                      <p>{i18n.t("pages.home.resumen.otros")}</p>
                      <strong>{resumen.otros}</strong>
                      <span>{i18n.t("pages.home.resumen.registrados")}</span>
                    </div>

                    <img src="mismaquinasnaranja.png" alt="" />
                  </Link>

                  {/* MANTENIMIENTOS */}
                  <Link to="/mantenimientos" className="tarjetaresumen">
                    <div>
                      <p>{i18n.t("pages.home.resumen.mantenimientos")}</p>
                      <strong>{resumen.mantenimientosActivos}</strong>
                      <span>{i18n.t("pages.home.resumen.activos")}</span>
                    </div>

                    <img src="mantenimientosnaranja.png" alt="" />
                  </Link>

                  {/* PERSONAL */}
                  <Link to="/configuracion" className="tarjetaresumen">
                    <div>
                      <p>{i18n.t("pages.home.resumen.personal")}</p>
                      <strong>{resumen.personal}</strong>
                      <span>{i18n.t("pages.home.resumen.miembros")}</span>
                    </div>

                    <img src="iconopersonal.png" alt="" />
                  </Link>
                </div>
              )}
            </section>

            {/* ATENCIÓN + ÚLTIMOS, lado a lado */}
            <div id="filasegundaresumenhome">
              <section id="mantenimientosAtencionHome" className="tarjetaseccionhome">
                <div className="encabezado-seccion-home">
                  <h2>{i18n.t("pages.home.atencion.titulo")}</h2>
                  <Link to="/historial">{i18n.t("pages.home.atencion.ver_todos")}</Link>
                </div>

                <div id="listaatencionhome">
                  {urgentes.length === 0 ? (
                    <p className="home-vacio">{i18n.t("pages.home.atencion.vacio")}</p>
                  ) : (
                    urgentes.map((item) => (
                      <div className="filaatencionhome" key={item.id}>
                        <div>
                          <strong>{item.machine?.name || "—"}</strong>
                          <span>{item.title}</span>
                        </div>

                        <span className={`estado-atencion ${item.estado}`}>
                          {etiquetaUrgencia(item)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section id="ultimosmantenimientoshome" className="tarjetaseccionhome">
                <div className="encabezado-seccion-home">
                  <h2>{i18n.t("pages.home.ultimos.titulo")}</h2>
                  <Link to="/mantenimientos">{i18n.t("pages.home.ultimos.ver_todos")}</Link>
                </div>

                <div id="listaultimosmantenimientoshome">
                  {ultimos.length === 0 ? (
                    <p className="home-vacio">{i18n.t("pages.home.ultimos.vacio")}</p>
                  ) : (
                    ultimos.map((item) => {
                      const slug = estadoSlug(item.estado);
                      return (
                        <div className="filamantenimientohome" key={item.id}>
                          <div>
                            <strong>{item.machine?.name || "—"}</strong>
                            <span className="tipo-mantenimiento">{item.title}</span>
                          </div>

                          <div className="info-derecha">
                            <span className="fecha-mantenimiento">
                              {new Date(`${item.fecha}T00:00:00`).toLocaleDateString(
                                i18n.language || "es",
                                { day: "2-digit", month: "2-digit", year: "numeric" },
                              )}
                            </span>
                            <span className={`estado-mini ${slug}`}>
                              {i18n.t(`pages.home.ultimos.estado.${slug}`, {
                                defaultValue: item.estado,
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* BANNER DE PLANES */}
            <section id="bannerplanhome">
              <div>
                <h2>{i18n.t("pages.home.banner.titulo")}</h2>
                <p>{i18n.t("pages.home.banner.subtitulo")}</p>
              </div>

              <Link to="/planes" id="botonverplanhome">
                {i18n.t("pages.home.banner.boton")}
              </Link>
            </section>
          </main>

          {/* ================= ACCIONES RAPIDAS + NOTIFICACIONES ================= */}
          <aside id="accionesrapidas">
            <h2>{i18n.t("pages.home.acciones.titulo")}</h2>

            <NavLink to="/mantenimientos" className="accionrapida">
              <div className="iconoaccion">
                <img src="nuevaorden.png" alt="" />
              </div>
              <span>{i18n.t("pages.home.acciones.nueva_orden")}</span>
            </NavLink>

            <NavLink to="/mismaquinas" className="accionrapida">
              <div className="iconoaccion">
                <img src="mismaquinasnaranja.png" alt="" />
              </div>
              <span>{i18n.t("pages.home.acciones.registrar_maquina")}</span>
            </NavLink>

            <NavLink to="/configuracion" className="accionrapida">
              <div className="iconoaccion">
                <img src="iconopersonal.png" alt="" />
              </div>
              <span>{i18n.t("pages.home.acciones.agregar_personal")}</span>
            </NavLink>

            <NavLink to="/historial" className="accionrapida">
              <div className="iconoaccion">
                <img src="reportesnaranja.png" alt="" />
              </div>
              <span>{i18n.t("pages.home.acciones.ver_reportes")}</span>
            </NavLink>

            {/* NOTIFICACIONES RECIENTES */}
            <div id="notificacionesresumenhome">
              <div className="encabezado-seccion-home">
                <h2>{i18n.t("pages.home.notificaciones.titulo")}</h2>
                <Link to="/notificaciones">
                  {i18n.t("pages.home.notificaciones.ver_todas")}
                </Link>
              </div>

              {notificaciones.length === 0 ? (
                <p className="home-vacio">
                  {i18n.t("pages.home.notificaciones.vacio")}
                </p>
              ) : (
                notificaciones.map((notif) => (
                  <div
                    className={`notifhome ${notif.read ? "" : "no-leida"}`}
                    key={notif._id}
                  >
                    <span className="notifhome-titulo">{notif.title}</span>
                    <span className="notifhome-fecha">
                      {fechaNotificacion(notif.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
