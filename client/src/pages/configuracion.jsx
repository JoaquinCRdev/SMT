import { NavLink } from "react-router-dom";
import Sidebar from "../components/layout/sidebar";
import "../styles/pages/configuracion.css";
import { useEffect, useState } from "react";

const Configuracion = () => {
  const personal = [
    { name: "Juan Pérez", role: "Mecánico", active: true },
    { name: "María Gómez", role: "Recepcionista", active: true },
    { name: "Carlos López", role: "Técnico", active: true },
    { name: "Laura Fernández", role: "Administradora", active: true },
    { name: "Diego Martínez", role: "Mecánico", active: true },
    { name: "Sofía Ramírez", role: "Asistente", active: true },
    { name: "Ezequiel Torres", role: "Técnico", active: false },
    { name: "Nicolás Silva", role: "Mecánico", active: true },
  ];

  const solicitudes = [
    { name: "Andrés Castillo", date: "20/05/2024" },
    { name: "Gabriela Herrera", date: "19/05/2024" },
    { name: "Matías Romero", date: "18/05/2024" },
  ];

  const [modoOscuro, setModoOscuro] = useState(() => {
    const saved = localStorage.getItem("mode");
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.body.classList.toggle("light-mode", !modoOscuro);

    localStorage.setItem("mode", JSON.stringify(modoOscuro));
  }, [modoOscuro]);

  const toggleModoOscuro = () => setModoOscuro((v) => !v);

  const [tamanoGrande, setTamanoGrande] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved === "grande";
  });

  useEffect(() => {
    document.body.classList.toggle("tamano-grande", tamanoGrande);

    localStorage.setItem("fontSize", tamanoGrande ? "grande" : "pequeno");
  }, [tamanoGrande]);

  const toggleTamano = () => {
    setTamanoGrande((v) => !v);
  };

  return (
    <div className="containerConfig">
      <Sidebar></Sidebar>
      <div className="smt-page">
        {/* HEADER */}
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

                <span className="user-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* TITULO */}
        <div className="page-header">
          <h1 className="page-title">Personalización</h1>
          <p className="page-subtitle">Personaliza y gestiona tu taller.</p>
        </div>

        {/* PERSONALIZACIÓN */}
        <section className="section-card">
          <div className="personalizacion-grid">
            {/* PLAN */}
            <div className="sub-card">
              <span className="sub-card-title">Plan actual</span>

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
                    <span className="plan-name">Básico</span>

                    <span className="plan-desc">
                      Ideal para talleres en crecimiento.
                    </span>
                  </div>
                </div>

                <NavLink className="btn-outline-orange" to={"/planes"}>
                  Actualizar a Pro
                </NavLink>
              </div>
            </div>

            {/* MODO */}
            <button
              className="toggle-mode"
              type="button"
              onClick={toggleModoOscuro}
              aria-pressed={modoOscuro}
              aria-label={
                modoOscuro
                  ? "Cambiar a modo claro (Alt+D)"
                  : "Cambiar a modo oscuro (Alt+D)"
              }
              title={
                modoOscuro
                  ? "Modo oscuro activo — Alt+D"
                  : "Modo claro activo — Alt+D"
              }
            >
              {modoOscuro ? "🌙 Modo Oscuro" : "☀️ Modo Claro"}
            </button>

            {/* FUENTE */}
            <div className="sub-card">
              <span className="sub-card-title">Tamaño de fuente</span>

              <button
                className="toggle-mode"
                type="button"
                onClick={toggleTamano}
                aria-pressed={tamanoGrande}
                aria-label={
                  tamanoGrande
                    ? "Cambiar a tamaño pequeño"
                    : "Cambiar a tamaño grande"
                } 
                title={
                  tamanoGrande
                    ? "Tamaño grande activo"
                    : "Tamaño pequeño activo"
                }
              >
                {tamanoGrande ? "Grande" : "Pequeño"}
              </button>
            </div>

            {/* IDIOMA */}
            <div className="sub-card">
              <span className="sub-card-title">Idioma</span>

              <div className="select-box">
                <div className="select-content">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Español
                </div>

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* GESTIÓN DE PERSONAL */}
        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">Gestión de personal</h2>

            <p className="section-subtitle">
              Administra el personal que tiene acceso al taller.
            </p>
          </div>

          <div className="staff-grid">
            {personal.map((staff, idx) => (
              <div key={idx} className="staff-card">
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
                    <span className="staff-name">{staff.name}</span>

                    <span className="staff-role">{staff.role}</span>
                  </div>
                </div>

                <div className="staff-status">
                  <span className="status-label">Estado</span>

                  <div className="status-indicator">
                    <span
                      className={`dot ${staff.active ? "active" : "inactive"}`}
                    />

                    {staff.active ? "Activo" : "Inactivo"}
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
                  Modificar
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

          <button className="btn-add-staff">
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
            Agregar personal
          </button>
        </section>

        {/* SOLICITUDES */}
        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">Solicitudes pendientes</h2>

            <p className="section-subtitle">
              Personas que solicitaron unirse al taller.
            </p>
          </div>

          <div className="requests-list">
            {solicitudes.map((req, idx) => (
              <div key={idx} className="request-item">
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
                    <span className="request-name">{req.name}</span>

                    <span className="request-action-text">
                      solicita unirse al taller
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
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
                    Aceptar
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
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ACCIONES */}
        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">Acciones sobre el taller</h2>

            <p className="section-subtitle">
              Gestiona la información y configuración general de tu taller.
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
                  <span className="action-card-title">Modificar taller</span>

                  <span className="action-card-desc">
                    Edita la información general, configuración y detalles de tu
                    taller.
                  </span>
                </div>
              </div>

              <div className="action-card-btn-container">
                <button className="btn-action-outline-orange">
                  Ir a configuración
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
                  <span className="action-card-title">Borrar taller</span>

                  <span className="action-card-desc">
                    Elimina permanentemente tu taller y toda su información.
                  </span>
                </div>
              </div>

              <div className="action-card-btn-container">
                <button className="btn-action-outline-red">
                  Borrar taller
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Configuracion;
