import { NavLink } from "react-router-dom";
import Sidebar from "../components/layout/sidebar";
import "../styles/pages/configuracion.css";
import { useEffect, useState } from "react";
import i18n from "../i18n/i18n";

const Configuracion = () => {
  // Esto hace que el componente se vuelva a renderizar
  // cuando cambiamos el idioma.
  const [, setIdioma] = useState(i18n.language);

  const cambiarIdioma = async (e) => {
    const nuevoIdioma = e.target.value;

    await i18n.changeLanguage(nuevoIdioma);

    setIdioma(nuevoIdioma);
  };

  // =========================
  // MODO OSCURO
  // =========================
const [mostrarModalModificarTaller, setMostrarModalModificarTaller] =
  useState(false);

const [taller, setTaller] = useState({
  nombre: "Taller Central",
  descripcion: "Taller mecánico especializado en mantenimiento general.",
  direccion: "Av. Libertad 123",
  telefono: "11 1234-5678",
  logo: null,
  administrador: "Juan Pérez",
  gmail: "juan@taller.com",
});

const abrirModalModificarTaller = () => {
  setMostrarModalModificarTaller(true);
};

const cerrarModalModificarTaller = () => {
  setMostrarModalModificarTaller(false);
};

const handleTallerChange = (e) => {
  const { name, value } = e.target;

  setTaller((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleLogoChange = (e) => {
  const archivo = e.target.files[0];

  if (archivo) {
    setTaller((prev) => ({
      ...prev,
      logo: archivo,
    }));
  }
};

const guardarCambiosTaller = (e) => {
  e.preventDefault();

  console.log("Datos del taller:", taller);

  // Acá después conectamos el PUT/PATCH del backend.

  cerrarModalModificarTaller();
};

  const [modoOscuro, setModoOscuro] = useState(() => {
    const saved = localStorage.getItem("mode");

    if (saved !== null) {
      return JSON.parse(saved);
    }

    return (
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
    );
  });

  useEffect(() => {
    document.body.classList.toggle("light-mode", !modoOscuro);

    localStorage.setItem("mode", JSON.stringify(modoOscuro));
  }, [modoOscuro]);

  const toggleModoOscuro = () => {
    setModoOscuro((v) => !v);
  };

  // =========================
  // TAMAÑO DE FUENTE
  // =========================

  const [tamanoGrande, setTamanoGrande] = useState(() => {
    const saved = localStorage.getItem("fontSize");

    return saved === "grande";
  });

  useEffect(() => {
    document.body.classList.toggle("tamano-grande", tamanoGrande);

    localStorage.setItem(
      "fontSize",
      tamanoGrande ? "grande" : "pequeno"
    );
  }, [tamanoGrande]);

  const toggleTamano = () => {
    setTamanoGrande((v) => !v);
  };

  // =========================
  // PERSONAL
  // =========================

  const [personal, setPersonal] = useState([
    {
      name: "Juan Pérez",
      role: "Mecánico",
      active: true,
    },
    {
      name: "María Gómez",
      role: "Recepcionista",
      active: true,
    },
    {
      name: "Carlos López",
      role: "Técnico",
      active: true,
    },
    {
      name: "Laura Fernández",
      role: "Administradora",
      active: true,
    },
    {
      name: "Diego Martínez",
      role: "Mecánico",
      active: true,
    },
    {
      name: "Sofía Ramírez",
      role: "Asistente",
      active: true,
    },
    {
      name: "Ezequiel Torres",
      role: "Técnico",
      active: false,
    },
    {
      name: "Nicolás Silva",
      role: "Mecánico",
      active: true,
    },
  ]);

  // =========================
  // MODAL AGREGAR PERSONAL
  // =========================

  const [mostrarModalPersonal, setMostrarModalPersonal] = useState(false);

  const [nuevoPersonal, setNuevoPersonal] = useState({
    nombre: "",
    apellido: "",
    rol: "Colaborador",
    estado: "Activo",
  });

  const abrirModalPersonal = () => {
    setNuevoPersonal({
      nombre: "",
      apellido: "",
      rol: "Colaborador",
      estado: "Activo",
    });

    setMostrarModalPersonal(true);
  };

  const cerrarModalPersonal = () => {
    setMostrarModalPersonal(false);
  };

  // =========================
// MODAL BORRAR TALLER
// =========================

const [mostrarModalBorrarTaller, setMostrarModalBorrarTaller] =
  useState(false);

const abrirModalBorrarTaller = () => {
  setMostrarModalBorrarTaller(true);
};

const cerrarModalBorrarTaller = () => {
  setMostrarModalBorrarTaller(false);
};

const borrarTaller = () => {
  // Por ahora no hacemos nada con el backend.
  // Acá después iría la petición DELETE.
  
  console.log("Taller eliminado");

  cerrarModalBorrarTaller();
};



  const handleNuevoPersonal = (e) => {
    const { name, value } = e.target;

    setNuevoPersonal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarPersonal = (e) => {
    e.preventDefault();

    if (
      !nuevoPersonal.nombre.trim() ||
      !nuevoPersonal.apellido.trim()
    ) {
      return;
    }

    const persona = {
      name: `${nuevoPersonal.nombre.trim()} ${nuevoPersonal.apellido.trim()}`,
      role: nuevoPersonal.rol,
      active: nuevoPersonal.estado === "Activo",
    };

    setPersonal((prev) => [...prev, persona]);

    cerrarModalPersonal();
  };
  
  // =========================
  // SOLICITUDES
  // =========================

  const solicitudes = [
    {
      name: "Andrés Castillo",
      date: "20/05/2024",
    },
    {
      name: "Gabriela Herrera",
      date: "19/05/2024",
    },
    {
      name: "Matías Romero",
      date: "18/05/2024",
    },
  ];

  return (
    <div className="containerConfig">
      <Sidebar />

      <div className="smt-page">

        {/* =========================
            HEADER
        ========================= */}

        <header className="top-header">

          <button className="mobile-menu-btn">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="mobile-brand">
            <div className="logo-badge">SMT</div>
          </div>

          <div className="top-header-right">

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

                <span className="user-name">
                  Administrador

                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>

                <span className="user-role">
                  Admin
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* =========================
            TITULO
        ========================= */}

        <div className="page-header">

          <h1 className="page-title">
            {i18n.t("pages.configuracion.title")}
          </h1>

          <p className="page-subtitle">
            {i18n.t("pages.configuracion.subtitle")}
          </p>

        </div>

        {/* =========================
            PERSONALIZACIÓN
        ========================= */}

        <section className="section-card">

          <div className="personalizacion-grid">

            {/* PLAN */}

            <div className="sub-card">

              <span className="sub-card-title">
                {i18n.t(
                  "pages.configuracion.configs.plan.title",
                  "Plan actual"
                )}
              </span>

              <div className="plan-box">

                <div className="plan-info">

                  <div className="plan-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                    </svg>
                  </div>

                  <div className="plan-details">

                    <span className="plan-name">
                      {i18n.t(
                        "pages.configuracion.configs.plan.basico.name"
                      )}
                    </span>

                    <span className="plan-desc">
                      {i18n.t(
                        "pages.configuracion.configs.plan.basico.description"
                      )}
                    </span>

                  </div>

                </div>

                <NavLink
                  className="btn-outline-orange"
                  to="/planes"
                >
                  {i18n.t(
                    "pages.configuracion.configs.plan.basico.actualizar"
                  )}
                </NavLink>

              </div>

            </div>

            {/* MODO */}

            <button
              className="toggle-mode"
              type="button"
              onClick={toggleModoOscuro}
              aria-pressed={modoOscuro}
            >
              {modoOscuro
                ? i18n.t(
                    "pages.configuracion.configs.modo.claro"
                  )
                : i18n.t(
                    "pages.configuracion.configs.modo.oscuro"
                  )}
            </button>

            {/* FUENTE */}

            <div className="sub-card">

              <span className="sub-card-title">
                {i18n.t(
                  "pages.configuracion.configs.fuente.h2"
                )}
              </span>

              <button
                className="toggle-mode"
                type="button"
                onClick={toggleTamano}
                aria-pressed={tamanoGrande}
              >
                {tamanoGrande
                  ? i18n.t(
                      "pages.configuracion.configs.fuente.sizes.grande"
                    )
                  : i18n.t(
                      "pages.configuracion.configs.fuente.sizes.pequeño"
                    )}
              </button>

            </div>

            {/* IDIOMA */}

            <div className="sub-card">

              <span className="sub-card-title">
                {i18n.t(
                  "pages.configuracion.configs.idioma.title",
                  "Idioma"
                )}
              </span>

              <div className="select-box">

                <div className="select-content">
                  <select id="input-idioma"
                    value={i18n.language?.substring(0, 2)}
                    onChange={cambiarIdioma}
                  >
                    <option value="es">
                      {i18n.t(
                        "pages.configuracion.configs.idioma.es"
                      )}
                    </option>

                    <option value="en">
                      {i18n.t(
                        "pages.configuracion.configs.idioma.en"
                      )}
                    </option>

                    <option value="de">
                      {i18n.t(
                        "pages.configuracion.configs.idioma.de"
                      )}
                    </option>
                  </select>

                </div>
              </div>

            </div>

          </div>

        </section>

        {/* =========================
            GESTIÓN DE PERSONAL
        ========================= */}

        <section className="section-card">

          <div className="section-header">

            <h2 className="section-title">
              {i18n.t(
                "pages.configuracion.configs.personal.h2"
              )}
            </h2>

            <p className="section-subtitle">
              {i18n.t(
                "pages.configuracion.configs.personal.p"
              )}
            </p>

          </div>

          <div className="staff-grid">

            {personal.map((staff, idx) => (

              <div
                key={idx}
                className="staff-card"
              >

                <div className="staff-header">

                  <div className="staff-avatar">

                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>

                  </div>

                  <div className="staff-meta">

                    <span className="staff-name">
                      {staff.name}
                    </span>

                    <span className="staff-role">
                      {staff.role}
                    </span>

                  </div>

                </div>

                <div className="staff-status">

                  <span className="status-label">
                    {i18n.t(
                      "pages.configuracion.configs.personal.estado"
                    )}
                  </span>

                  <div className="status-indicator">

                    <span
                      className={`dot ${
                        staff.active
                          ? "active"
                          : "inactive"
                      }`}
                    />

                    {staff.active
                      ? i18n.t(
                          "pages.configuracion.configs.personal.activo",
                          "Activo"
                        )
                      : i18n.t(
                          "pages.configuracion.configs.personal.inactivo",
                          "Inactivo"
                        )}

                  </div>

                </div>

                <button className="btn-modify">

                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>

                  {i18n.t(
                    "pages.configuracion.configs.personal.modificar"
                  )}

                </button>

                <button className="btn-modify-icon-only">

                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>

                </button>

              </div>

            ))}

          </div>

          <button 
          className="btn-add-staff"
          type="button"
          onClick={abrirModalPersonal}>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>

            {i18n.t(
              "pages.configuracion.configs.personal.agregar"
            )}

          </button>

        </section>

        {/* =========================
            SOLICITUDES
        ========================= */}

        <section className="section-card">

          <div className="section-header">

            <h2 className="section-title">
              {i18n.t(
                "pages.configuracion.configs.solicitudes.h2"
              )}
            </h2>

            <p className="section-subtitle">
              {i18n.t(
                "pages.configuracion.configs.solicitudes.p"
              )}
            </p>

          </div>

          <div className="requests-list">

            {solicitudes.map((req, idx) => (

              <div
                key={idx}
                className="request-item"
              >

                <div className="request-user">

                  <div className="staff-avatar">

                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>

                  </div>

                  <div className="request-text">

                    <span className="request-name">
                      {req.name}
                    </span>

                    <span className="request-action-text">
                      {i18n.t(
                        "pages.configuracion.configs.solicitudes.solicitud.span"
                      )}
                    </span>

                  </div>

                </div>

                <div className="request-date">

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    />
                    <line
                      x1="16"
                      y1="2"
                      x2="16"
                      y2="6"
                    />
                    <line
                      x1="8"
                      y1="2"
                      x2="8"
                      y2="6"
                    />
                    <line
                      x1="3"
                      y1="10"
                      x2="21"
                      y2="10"
                    />
                  </svg>

                  {req.date}

                </div>

                <div className="request-buttons">

                  <button className="btn-accept">

                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 11 12 14 22 4" />
                    </svg>

                    {i18n.t(
                      "pages.configuracion.configs.solicitudes.solicitud.aceptar"
                    )}

                  </button>

                  <button className="btn-reject">

                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line
                        x1="15"
                        y1="9"
                        x2="9"
                        y2="15"
                      />
                      <line
                        x1="9"
                        y1="9"
                        x2="15"
                        y2="15"
                      />
                    </svg>

                    {i18n.t(
                      "pages.configuracion.configs.solicitudes.solicitud.rechazar"
                    )}

                  </button>

                </div>

              </div>

            ))}

          </div>

        </section>

        {/* =========================
            ACCIONES
        ========================= */}

        <section className="section-card">

          <div className="section-header">

            <h2 className="section-title">
              {i18n.t(
                "pages.configuracion.configs.acciones.h2"
              )}
            </h2>

            <p className="section-subtitle">
              {i18n.t(
                "pages.configuracion.configs.acciones.p"
              )}
            </p>

          </div>

          <div className="acciones-grid">

            {/* MODIFICAR */}

            <div className="action-card">

              <div className="action-card-header">

                <div className="action-icon-box orange">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>

                </div>

                <div className="action-card-info">

                  <span className="action-card-title">
                    {i18n.t(
                      "pages.configuracion.configs.acciones.modificar.span"
                    )}
                  </span>

                  <span className="action-card-desc">
                    {i18n.t(
                      "pages.configuracion.configs.acciones.modificar.descripcion"
                    )}
                  </span>

                </div>

              </div>

              <div className="action-card-btn-container">

                <button
  className="btn-action-outline-orange"
  type="button"
  onClick={abrirModalModificarTaller}
>
  {i18n.t(
    "pages.configuracion.configs.acciones.modificar.action"
  )}
</button>

              </div>

            </div>

            {/* BORRAR */}

            <div className="action-card">

              <div className="action-card-header">

                <div className="action-icon-box red">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>

                </div>

                <div className="action-card-info">

                  <span className="action-card-title">
                    {i18n.t(
                      "pages.configuracion.configs.acciones.borrar.span"
                    )}
                  </span>

                  <span className="action-card-desc">
                    {i18n.t(
                      "pages.configuracion.configs.acciones.borrar.descripcion"
                    )}
                  </span>

                </div>

              </div>

              <div className="action-card-btn-container">

               <button
  className="btn-action-outline-red"
  type="button"
  onClick={abrirModalBorrarTaller}
>
  {i18n.t(
    "pages.configuracion.configs.acciones.borrar.action"
  )}
</button>

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            MODAL AGREGAR PERSONAL
        ========================= */}

        {mostrarModalPersonal && (
          <div
            className="modal-overlay"
            onClick={cerrarModalPersonal}
          >
            <div
              className="modal-personal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="modal-personal-header">

                <div>
                  <h2 className="modal-personal-title">
                    Agregar personal
                  </h2>

                  <p className="modal-personal-subtitle">
                    Completá los datos del nuevo miembro del personal.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={cerrarModalPersonal}
                  aria-label="Cerrar"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

              </div>

              <form onSubmit={agregarPersonal}>

                <div className="modal-form-grid">

                  {/* NOMBRE */}

                  <div className="modal-form-group">

                    <label htmlFor="nombre">
                      Nombre
                    </label>

                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Ej. Juan"
                      value={nuevoPersonal.nombre}
                      onChange={handleNuevoPersonal}
                      autoComplete="off"
                    />

                  </div>

                  {/* APELLIDO */}

                  <div className="modal-form-group">

                    <label htmlFor="apellido">
                      Apellido
                    </label>

                    <input
                      id="apellido"
                      name="apellido"
                      type="text"
                      placeholder="Ej. Pérez"
                      value={nuevoPersonal.apellido}
                      onChange={handleNuevoPersonal}
                      autoComplete="off"
                    />

                  </div>

                  {/* ROL */}

                  <div className="modal-form-group">

                    <label htmlFor="rol">
                      Rol
                    </label>

                    <select
                      id="rol"
                      name="rol"
                      value={nuevoPersonal.rol}
                      onChange={handleNuevoPersonal}
                    >
                      <option value="Administrador">
                        Administrador
                      </option>

                      <option value="Colaborador">
                        Colaborador
                      </option>
                    </select>

                  </div>

                  {/* ESTADO */}

                  <div className="modal-form-group">

                    <label htmlFor="estado">
                      Estado
                    </label>

                    <select
                      id="estado"
                      name="estado"
                      value={nuevoPersonal.estado}
                      onChange={handleNuevoPersonal}
                    >
                      <option value="Activo">
                        Activo
                      </option>

                      <option value="Inactivo">
                        Inactivo
                      </option>
                    </select>

                  </div>

                </div>

                {/* BOTONES */}

                <div className="modal-personal-actions">

                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={cerrarModalPersonal}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-modal-save"
                  >
                    Agregar personal
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

        {mostrarModalModificarTaller && (
  <div
    className="modal-overlay"
    onClick={cerrarModalModificarTaller}
  >
    <div
      className="modal-taller"
      onClick={(e) => e.stopPropagation()}
    >

      {/* =========================
          HEADER
      ========================== */}

      <div className="modal-taller-header">

        <h2>Modificar taller</h2>

        <button
          type="button"
          className="modal-close"
          onClick={cerrarModalModificarTaller}
          aria-label="Cerrar"
        >
          ×
        </button>

      </div>


      {/* =========================
          FORMULARIO
      ========================== */}

      <form
        className="modal-taller-form"
        onSubmit={guardarCambiosTaller}
      >

        {/* =========================
            INFORMACIÓN DEL TALLER
        ========================== */}

        <div className="modal-taller-panel">

          <h3>Información de tu taller</h3>

          <div className="campo-modal-taller">
            <label htmlFor="nombreTallerModal">
              Nombre del taller
            </label>

            <input
              id="nombreTallerModal"
              name="nombre"
              type="text"
              value={taller.nombre}
              onChange={handleTallerChange}
            />
          </div>


          <div className="campo-modal-taller">
            <label htmlFor="descripcionTallerModal">
              Descripción
            </label>

            <textarea
              id="descripcionTallerModal"
              name="descripcion"
              rows="4"
              value={taller.descripcion}
              onChange={handleTallerChange}
            />
          </div>


          <div className="campo-modal-taller">
            <label htmlFor="direccionTallerModal">
              Dirección
            </label>

            <input
              id="direccionTallerModal"
              name="direccion"
              type="text"
              value={taller.direccion}
              onChange={handleTallerChange}
            />
          </div>


          <div className="campo-modal-taller">
            <label htmlFor="telefonoTallerModal">
              Teléfono
            </label>

            <input
              id="telefonoTallerModal"
              name="telefono"
              type="tel"
              value={taller.telefono}
              onChange={handleTallerChange}
            />
          </div>

        </div>


        {/* =========================
            PANEL DERECHO
        ========================== */}

        <div className="modal-taller-panel panel-taller-derecho">

          {/* LOGO */}

          <div className="modal-taller-logo">

            <h3>Logo del taller</h3>

            <label
              htmlFor="logoTallerModal"
              className="modal-logo-upload"
            >

              <div className="modal-logo-icon">

                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                  />

                  <circle
                    cx="8.5"
                    cy="8.5"
                    r="1.5"
                  />

                  <path d="M21 15l-5-5L5 21" />
                </svg>

              </div>

              <span className="modal-logo-title">
                {taller.logo
                  ? taller.logo.name
                  : "Subir logo"}
              </span>

              <span className="modal-logo-info">
                .JPG, .PNG (Max 2MB)
              </span>

              <input
                id="logoTallerModal"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                hidden
                onChange={handleLogoChange}
              />

            </label>

          </div>


          {/* ADMINISTRADOR */}

          <div className="modal-taller-administrador">

            <h3>Administrador</h3>

            <div className="campo-modal-taller">

              <label htmlFor="nombreAdministradorModal">
                Nombre completo
              </label>

              <input
                id="nombreAdministradorModal"
                name="administrador"
                type="text"
                value={taller.administrador}
                onChange={handleTallerChange}
              />

            </div>


            <div className="campo-modal-taller">

              <label htmlFor="gmailAdministradorModal">
                Gmail
              </label>

              <input
                id="gmailAdministradorModal"
                name="gmail"
                type="email"
                value={taller.gmail}
                onChange={handleTallerChange}
              />

            </div>

          </div>

        </div>


        {/* =========================
            BOTONES
        ========================== */}

        <div className="modal-taller-actions">

          <button
            type="button"
            className="btn-modal-cancel"
            onClick={cerrarModalModificarTaller}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-modal-save"
          >
            Guardar cambios
          </button>

        </div>

      </form>

    </div>
  </div>
)}

        {/* =========================
    MODAL BORRAR TALLER
========================= */}

{mostrarModalBorrarTaller && (
  <div
    className="modal-overlay"
    onClick={cerrarModalBorrarTaller}
  >
    <div
      className="modal-delete"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="modal-delete-header">

        <div className="modal-delete-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={cerrarModalBorrarTaller}
          aria-label="Cerrar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

      </div>

      <div className="modal-delete-content">

        <h2 className="modal-delete-title">
          ¿Querés borrar definitivamente el taller?
        </h2>

        <p className="modal-delete-text">
          Esta acción es permanente y no se podrá deshacer.
          Todos los datos asociados al taller podrían perderse.
        </p>

      </div>

      <div className="modal-delete-actions">

        <button
          type="button"
          className="btn-modal-cancel"
          onClick={cerrarModalBorrarTaller}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="btn-modal-delete"
          onClick={borrarTaller}
        >
          Borrar definitivamente
        </button>

      </div>

    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default Configuracion;
