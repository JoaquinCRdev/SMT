import { NavLink, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/sidebar";
import "../styles/pages/configuracion.css";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n/i18n";
import { getRedirectPath } from "../utils/redirectByUser";
import { ETIQUETA_ROL, etiquetaRol } from "../utils/roles";

const fechaSolicitud = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const Configuracion = () => {
  const { user, refetchProfile } = useAuth();
  const navigate = useNavigate();

  const [, setIdioma] = useState(i18n.language);

  const cambiarIdioma = async (e) => {
    const nuevoIdioma = e.target.value;

    await i18n.changeLanguage(nuevoIdioma);

    setIdioma(nuevoIdioma);
  };
  const [mostrarModalModificarTaller, setMostrarModalModificarTaller] =
    useState(false);

  const [taller, setTaller] = useState({
    _id: null,
    nombre: "",
    direccion: "",
    telefono: "",
    codigo: "",
    owner: null,
  });

  const [personal, setPersonal] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // El backend (assertOwner) sólo deja administrar el taller al dueño, así que la UI tiene que ocultarle esas acciones a los demás administradores.
  const idDueño = taller.owner?._id ?? taller.owner;
  const esDueño = Boolean(user?._id) && String(idDueño) === String(user._id);

  // El endpoint trae pending + approved + completed: las acciones sólo existen sobre las pending, porque resolver una ya resuelta responde 400.
  const solicitudesPendientes = solicitudes.filter(
    (r) => r.status === "pending",
  );
  const solicitudesResueltas = solicitudes.filter(
    (r) => r.status !== "pending",
  );

  const mensajeError = (err, porDefecto) =>
    err.response?.data?.message || porDefecto;

  const abrirModalModificarTaller = () => {
    setError("");
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

  const guardarCambiosTaller = async (e) => {
    e.preventDefault();

    if (!taller.nombre.trim()) {
      setError("El nombre del taller no puede quedar vacío");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const { data } = await api.patch(`/workshops/${taller._id}`, {
        name: taller.nombre.trim(),
        address: taller.direccion.trim(),
        phone: taller.telefono.trim(),
      });

      setTaller((prev) => ({ ...prev, ...data }));
      cerrarModalModificarTaller();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el taller"));
    } finally {
      setGuardando(false);
    }
  };

  const [modoOscuro, setModoOscuro] = useState(() => {
    const saved = localStorage.getItem("mode");

    if (saved !== null) {
      return JSON.parse(saved);
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.body.classList.toggle("light-mode", !modoOscuro);

    localStorage.setItem("mode", JSON.stringify(modoOscuro));
  }, [modoOscuro]);

  const toggleModoOscuro = () => {
    setModoOscuro((v) => !v);
  };

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

  const [mostrarModalPersonal, setMostrarModalPersonal] = useState(false);

  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState(null);

  const [nuevoPersonal, setNuevoPersonal] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "user",
  });

  const abrirModalPersonal = () => {
    setNuevoPersonal({
      nombre: "",
      email: "",
      password: "",
      rol: "user",
    });
    setError("");
    setMostrarModalPersonal(true);
  };

  const cerrarModalPersonal = () => {
    setMostrarModalPersonal(false);
  };

  const abrirModalEditarMiembro = (miembro) => {
    setMiembroEditando({
      _id: miembro._id,
      nombre: miembro.name,
      email: miembro.email,
      rol: miembro.role,
      activo: miembro.isActive !== false,
      password: "",
    });
    setError("");
    setMostrarModalEditar(true);
  };

  const cerrarModalEditarMiembro = () => {
    setMostrarModalEditar(false);
    setMiembroEditando(null);
  };

  const [mostrarModalBorrarTaller, setMostrarModalBorrarTaller] =
    useState(false);

  const abrirModalBorrarTaller = () => {
    setError("");
    setMostrarModalBorrarTaller(true);
  };

  const cerrarModalBorrarTaller = () => {
    setMostrarModalBorrarTaller(false);
  };

  const borrarTaller = async () => {
    try {
      setGuardando(true);
      setError("");

      await api.delete(`/workshops/${taller._id}`);

      // El dueño queda sin taller: hay que sacar la página y mandar a elegir.
      const perfil = await refetchProfile();

      cerrarModalBorrarTaller();
      navigate(getRedirectPath(perfil || user), { replace: true });
    } catch (err) {
      setError(mensajeError(err, "No se pudo borrar el taller"));
    } finally {
      setGuardando(false);
    }
  };

  const handleNuevoPersonal = (e) => {
    const { name, value } = e.target;

    setNuevoPersonal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMiembroChange = (e) => {
    const { name, value } = e.target;

    setMiembroEditando((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarPersonal = async (e) => {
    e.preventDefault();

    if (
      nuevoPersonal.nombre.trim().length < 3 ||
      !nuevoPersonal.email.trim() ||
      nuevoPersonal.password.length < 8
    ) {
      setError(
        "Revisá el nombre (mínimo 3 caracteres), el email y la contraseña (mínimo 8)",
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await api.post("/workshops/mine/members", {
        name: nuevoPersonal.nombre.trim(),
        email: nuevoPersonal.email.trim(),
        password: nuevoPersonal.password,
        role: nuevoPersonal.rol,
      });

      cerrarModalPersonal();
      await recargarPersonal();
    } catch (err) {
      setError(mensajeError(err, "No se pudo agregar al miembro"));
    } finally {
      setGuardando(false);
    }
  };

  const guardarMiembro = async (e) => {
    e.preventDefault();

    if (miembroEditando.nombre.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres");
      return;
    }

    if (miembroEditando.password && miembroEditando.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    const payload = {
      name: miembroEditando.nombre.trim(),
      role: miembroEditando.rol,
      isActive: miembroEditando.activo,
    };

    // La contraseña solo se manda si el admin quiere resetearla.
    if (miembroEditando.password) {
      payload.password = miembroEditando.password;
    }

    try {
      setGuardando(true);
      setError("");

      await api.patch(
        `/workshops/mine/members/${miembroEditando._id}`,
        payload,
      );

      cerrarModalEditarMiembro();
      await recargarPersonal();
    } catch (err) {
      setError(mensajeError(err, "No se pudo actualizar al miembro"));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMiembro = async (miembro) => {
    if (!window.confirm(`¿Sacar a ${miembro.name} del taller?`)) {
      return;
    }

    try {
      setError("");
      await api.delete(`/workshops/${taller._id}/members/${miembro._id}`);
      await recargarPersonal();
    } catch (err) {
      setError(mensajeError(err, "No se pudo quitar al miembro"));
    }
  };

  const resolverSolicitud = async (solicitud, status) => {
    try {
      setError("");
      await api.patch(`/workshops/requests/${solicitud._id}`, { status });
      await recargarSolicitudes();
    } catch (err) {
      setError(mensajeError(err, "No se pudo resolver la solicitud"));
    }
  };

  const recargarPersonal = async () => {
    try {
      const { data } = await api.get("/workshops/mine/members");
      setPersonal(data);
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar el personal"));
    }
  };

  const recargarSolicitudes = async () => {
    try {
      const { data } = await api.get("/workshops/requests");
      setSolicitudes(data);
    } catch (err) {
      setError(mensajeError(err, "No se pudieron cargar las solicitudes"));
    }
  };

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const [tallerRes, personalRes] = await Promise.all([
          api.get("/workshops/mine"),
          api.get("/workshops/mine/members"),
        ]);
        if (cancelado) return;

        setTaller((prev) => ({
          ...prev,
          _id: tallerRes.data._id,
          nombre: tallerRes.data.name || "",
          direccion: tallerRes.data.address || "",
          telefono: tallerRes.data.phone || "",
          codigo: tallerRes.data.code || "",
          owner: tallerRes.data.owner,
        }));
        setPersonal(personalRes.data);
      } catch (err) {
        if (cancelado) return;
        setError(mensajeError(err, "No se pudo cargar la configuración"));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  // Las solicitudes sólo las puede resolver el dueño del taller (assertOwner en el backend), así que ni se piden ni se muestran para el resto.
  useEffect(() => {
    if (!esDueño) return;

    let cancelado = false;

    (async () => {
      try {
        const { data } = await api.get("/workshops/requests");
        if (cancelado) return;
        setSolicitudes(data);
      } catch (err) {
        if (cancelado) return;
        setError(mensajeError(err, "No se pudieron cargar las solicitudes"));
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [esDueño]);

  return (
    <div className="containerConfig">
      <Sidebar />

      <div className="smt-page">
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
                  {user?.name || "—"}

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

                <span className="user-role">{etiquetaRol(user?.role)}</span>
              </div>
            </div>
          </div>
        </header>

        {/*
            TITULO
       */}

        <div className="page-header">
          <h1 className="page-title">{i18n.t("pages.configuracion.title")}</h1>

          <p className="page-subtitle">
            {i18n.t("pages.configuracion.subtitle")}
          </p>
        </div>

        {/*
            PERSONALIZACIÓN
       */}

        <section className="section-card">
          <div className="personalizacion-grid">
            {/* PLAN */}

            <div className="sub-card">
              <span className="sub-card-title">
                {i18n.t(
                  "pages.configuracion.configs.plan.title",
                  "Plan actual",
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
                      {i18n.t("pages.configuracion.configs.plan.basico.name")}
                    </span>

                    <span className="plan-desc">
                      {i18n.t(
                        "pages.configuracion.configs.plan.basico.description",
                      )}
                    </span>
                  </div>
                </div>

                <NavLink className="btn-outline-orange" to="/planes">
                  {i18n.t("pages.configuracion.configs.plan.basico.actualizar")}
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
                ? i18n.t("pages.configuracion.configs.modo.claro")
                : i18n.t("pages.configuracion.configs.modo.oscuro")}
            </button>

            {/* FUENTE */}

            <div className="sub-card">
              <span className="sub-card-title">
                {i18n.t("pages.configuracion.configs.fuente.h2")}
              </span>

              <button
                className="toggle-mode"
                type="button"
                onClick={toggleTamano}
                aria-pressed={tamanoGrande}
              >
                {tamanoGrande
                  ? i18n.t("pages.configuracion.configs.fuente.sizes.grande")
                  : i18n.t("pages.configuracion.configs.fuente.sizes.pequeño")}
              </button>
            </div>

            {/* IDIOMA */}

            <div className="sub-card">
              <span className="sub-card-title">
                {i18n.t("pages.configuracion.configs.idioma.title", "Idioma")}
              </span>

              <div className="select-box">
                <div className="select-content">
                  <select
                    id="input-idioma"
                    value={i18n.language?.substring(0, 2)}
                    onChange={cambiarIdioma}
                  >
                    <option value="es">
                      {i18n.t("pages.configuracion.configs.idioma.es")}
                    </option>

                    <option value="en">
                      {i18n.t("pages.configuracion.configs.idioma.en")}
                    </option>

                    <option value="de">
                      {i18n.t("pages.configuracion.configs.idioma.de")}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
            GESTIÓN DE PERSONAL
       */}

        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              {i18n.t("pages.configuracion.configs.personal.h2")}
            </h2>

            <p className="section-subtitle">
              {i18n.t("pages.configuracion.configs.personal.p")}
            </p>
          </div>

          <div className="staff-grid">
            {cargando && (
              <p className="config-cargando">Cargando el taller...</p>
            )}

            {!cargando && error && <p className="config-error">{error}</p>}

            {!cargando && !error && personal.length === 0 && (
              <p className="config-cargando">
                Todavía no hay miembros en el taller.
              </p>
            )}

            {personal.map((staff) => {
              // El dueño no se puede editar ni quitar (el backend lo rechaza).
              const esElDueño = String(idDueño) === String(staff._id);

              return (
                <div key={staff._id} className="staff-card">
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

                      <span className="staff-role">
                        {esElDueño
                          ? "Administrador del taller"
                          : ETIQUETA_ROL[staff.role] || "Colaborador"}{" "}
                      </span>

                      <span className="staff-email">{staff.email}</span>
                    </div>
                  </div>

                  <div className="staff-status">
                    <span className="status-label">
                      {i18n.t("pages.configuracion.configs.personal.estado")}
                    </span>

                    <div className="status-indicator">
                      <span
                        className={`dot ${
                          staff.isActive !== false ? "active" : "inactive"
                        }`}
                      />

                      {staff.isActive !== false
                        ? i18n.t(
                            "pages.configuracion.configs.personal.activo",
                            "Activo",
                          )
                        : i18n.t(
                            "pages.configuracion.configs.personal.inactivo",
                            "Inactivo",
                          )}
                    </div>
                  </div>

                  {!esElDueño && esDueño && (
                    <button
                      className="btn-modify"
                      type="button"
                      onClick={() => abrirModalEditarMiembro(staff)}
                    >
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

                      {i18n.t("pages.configuracion.configs.personal.modificar")}
                    </button>
                  )}

                  {!esElDueño && esDueño && (
                    <button
                      className="btn-modify-icon-only"
                      type="button"
                      title="Quitar del taller"
                      onClick={() => eliminarMiembro(staff)}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {esDueño && (
            <button
              className="btn-add-staff"
              type="button"
              onClick={abrirModalPersonal}
            >
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

              {i18n.t("pages.configuracion.configs.personal.agregar")}
            </button>
          )}
        </section>

        {/*
            SOLICITUDES
       */}

        {esDueño && (
          <section className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                {i18n.t("pages.configuracion.configs.solicitudes.h2")}
              </h2>

              <p className="section-subtitle">
                {i18n.t("pages.configuracion.configs.solicitudes.p")}
              </p>
            </div>

            <div className="requests-list">
              {!cargando && solicitudes.length === 0 && (
                <p className="config-cargando">
                  No hay solicitudes pendientes.
                </p>
              )}

              {solicitudesPendientes.length > 0 && (
                <>
                  <h3 className="requests-subtitulo">
                    {i18n.t(
                      "pages.configuracion.configs.solicitudes.pendientes",
                    )}
                  </h3>

                  {solicitudesPendientes.map((req) => (
                    <div key={req._id} className="request-item">
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
                            {req.user?.name || "Usuario desconocido"}
                          </span>

                          <span className="request-action-text">
                            {i18n.t(
                              "pages.configuracion.configs.solicitudes.solicitud.span",
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
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>

                        {fechaSolicitud(req.createdAt)}
                      </div>

                      <div className="request-buttons">
                        <button
                          className="btn-accept"
                          type="button"
                          onClick={() => resolverSolicitud(req, "approved")}
                        >
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
                            "pages.configuracion.configs.solicitudes.solicitud.aceptar",
                          )}
                        </button>

                        <button
                          className="btn-reject"
                          type="button"
                          onClick={() => resolverSolicitud(req, "rejected")}
                        >
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

                          {i18n.t(
                            "pages.configuracion.configs.solicitudes.solicitud.rechazar",
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {solicitudesResueltas.length > 0 && (
                <>
                  <h3 className="requests-subtitulo">
                    {i18n.t(
                      "pages.configuracion.configs.solicitudes.resueltas",
                    )}
                  </h3>

                  {solicitudesResueltas.map((req) => (
                    <div key={req._id} className="request-item">
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
                            {req.user?.name || "Usuario desconocido"}
                          </span>

                          <span className="request-action-text">
                            {i18n.t(
                              "pages.configuracion.configs.solicitudes.solicitud.resuelta",
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
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>

                        {fechaSolicitud(req.createdAt)}
                      </div>

                      <span
                        className={`request-estado ${
                          req.status === "completed" ? "completada" : "aprobada"
                        }`}
                      >
                        {i18n.t(
                          `pages.configuracion.configs.solicitudes.estado.${req.status}`,
                        )}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        )}

        {/*
            ACCIONES
       */}

        {esDueño && (
          <section className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                {i18n.t("pages.configuracion.configs.acciones.h2")}
              </h2>

              <p className="section-subtitle">
                {i18n.t("pages.configuracion.configs.acciones.p")}
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
                        "pages.configuracion.configs.acciones.modificar.span",
                      )}
                    </span>

                    <span className="action-card-desc">
                      {i18n.t(
                        "pages.configuracion.configs.acciones.modificar.descripcion",
                      )}
                    </span>
                  </div>
                </div>

                <div className="action-card-btn-container">
                  {esDueño && (
                    <button
                      className="btn-action-outline-orange"
                      type="button"
                      onClick={abrirModalModificarTaller}
                    >
                      {i18n.t(
                        "pages.configuracion.configs.acciones.modificar.action",
                      )}
                    </button>
                  )}
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
                        "pages.configuracion.configs.acciones.borrar.span",
                      )}
                    </span>

                    <span className="action-card-desc">
                      {i18n.t(
                        "pages.configuracion.configs.acciones.borrar.descripcion",
                      )}
                    </span>
                  </div>
                </div>

                <div className="action-card-btn-container">
                  {esDueño && (
                    <button
                      className="btn-action-outline-red"
                      type="button"
                      onClick={abrirModalBorrarTaller}
                    >
                      {i18n.t(
                        "pages.configuracion.configs.acciones.borrar.action",
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/*
            MODAL AGREGAR PERSONAL
       */}

        {mostrarModalPersonal && (
          <div className="modal-overlay" onClick={cerrarModalPersonal}>
            <div
              className="modal-personal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-personal-header">
                <div>
                  <h2 className="modal-personal-title">Agregar personal</h2>

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
                    <label htmlFor="nombre">Nombre y apellido</label>

                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={nuevoPersonal.nombre}
                      onChange={handleNuevoPersonal}
                      autoComplete="off"
                    />
                  </div>

                  {/* EMAIL */}

                  <div className="modal-form-group">
                    <label htmlFor="email">Email</label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Ej. juan@taller.com"
                      value={nuevoPersonal.email}
                      onChange={handleNuevoPersonal}
                      autoComplete="off"
                    />
                  </div>

                  {/* CONTRASEÑA */}

                  <div className="modal-form-group">
                    <label htmlFor="password">Contraseña</label>

                    <input
                      id="password"
                      name="password"
                      type="text"
                      placeholder="Mínimo 8 caracteres"
                      value={nuevoPersonal.password}
                      onChange={handleNuevoPersonal}
                      autoComplete="off"
                    />

                    <small className="modal-form-hint">
                      Se usa para que la persona pueda iniciar sesión.
                    </small>
                  </div>

                  {/* ROL */}

                  <div className="modal-form-group">
                    <label htmlFor="rol">Rol</label>

                    <select
                      id="rol"
                      name="rol"
                      value={nuevoPersonal.rol}
                      onChange={handleNuevoPersonal}
                    >
                      <option value="user">Colaborador</option>

                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="config-error modal-form-error">{error}</p>
                )}

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
                    disabled={guardando}
                  >
                    {guardando ? "Agregando..." : "Agregar personal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*
            MODAL EDITAR MIEMBRO
      = */}

        {mostrarModalEditar && miembroEditando && (
          <div className="modal-overlay" onClick={cerrarModalEditarMiembro}>
            <div
              className="modal-personal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-personal-header">
                <div>
                  <h2 className="modal-personal-title">Editar miembro</h2>

                  <p className="modal-personal-subtitle">
                    {miembroEditando.email}
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={cerrarModalEditarMiembro}
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

              <form onSubmit={guardarMiembro}>
                <div className="modal-form-grid">
                  <div className="modal-form-group">
                    <label htmlFor="editarNombre">Nombre y apellido</label>

                    <input
                      id="editarNombre"
                      name="nombre"
                      type="text"
                      value={miembroEditando.nombre}
                      onChange={handleMiembroChange}
                      autoComplete="off"
                    />
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="editarRol">Rol</label>

                    <select
                      id="editarRol"
                      name="rol"
                      value={miembroEditando.rol}
                      onChange={handleMiembroChange}
                    >
                      <option value="user">Colaborador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="editarActivo">Estado</label>

                    <select
                      id="editarActivo"
                      name="activo"
                      value={miembroEditando.activo ? "true" : "false"}
                      onChange={(e) =>
                        handleMiembroChange({
                          target: {
                            name: "activo",
                            value: e.target.value === "true",
                          },
                        })
                      }
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="editarPassword">Nueva contraseña</label>

                    <input
                      id="editarPassword"
                      name="password"
                      type="text"
                      placeholder="Dejala vacía para no cambiarla"
                      value={miembroEditando.password}
                      onChange={handleMiembroChange}
                      autoComplete="off"
                    />

                    <small className="modal-form-hint">
                      Mínimo 8 caracteres, opcional.
                    </small>
                  </div>
                </div>

                {error && (
                  <p className="config-error modal-form-error">{error}</p>
                )}

                <div className="modal-personal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={cerrarModalEditarMiembro}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-modal-save"
                    disabled={guardando}
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {mostrarModalModificarTaller && (
          <div className="modal-overlay" onClick={cerrarModalModificarTaller}>
            <div className="modal-taller" onClick={(e) => e.stopPropagation()}>
              {/*
          HEADER */}

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

              {/*
          FORMULARIO */}

              <form
                className="modal-taller-form"
                onSubmit={guardarCambiosTaller}
              >
                {/*
            INFORMACIÓN DEL TALLER */}

                <div className="modal-taller-panel">
                  <h3>Información de tu taller</h3>

                  <div className="campo-modal-taller">
                    <label htmlFor="nombreTallerModal">Nombre del taller</label>

                    <input
                      id="nombreTallerModal"
                      name="nombre"
                      type="text"
                      value={taller.nombre}
                      onChange={handleTallerChange}
                    />
                  </div>

                  <div className="campo-modal-taller">
                    <label htmlFor="direccionTallerModal">Dirección</label>

                    <input
                      id="direccionTallerModal"
                      name="direccion"
                      type="text"
                      value={taller.direccion}
                      onChange={handleTallerChange}
                    />
                  </div>

                  <div className="campo-modal-taller">
                    <label htmlFor="telefonoTallerModal">Teléfono</label>

                    <input
                      id="telefonoTallerModal"
                      name="telefono"
                      type="tel"
                      value={taller.telefono}
                      onChange={handleTallerChange}
                    />
                  </div>
                </div>

                {/*
            PANEL DERECHO
      = */}

                <div className="modal-taller-panel panel-taller-derecho">
                  {/* CÓDIGO DEL TALLER */}

                  <div className="modal-taller-administrador">
                    <h3>Código del taller</h3>

                    <p className="modal-taller-codigo">
                      {taller.codigo || "—"}
                    </p>

                    <small className="modal-form-hint">
                      Es el código que comparten tus colaboradores para
                      solicitar incorporarse al taller.
                    </small>
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
                        type="text"
                        value={user?.name || "—"}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="campo-modal-taller">
                      <label htmlFor="gmailAdministradorModal">Email</label>

                      <input
                        id="gmailAdministradorModal"
                        type="email"
                        value={user?.email || "—"}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="config-error modal-form-error">{error}</p>
                )}

                {/*
            BOTONES
      = */}

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
                    disabled={guardando}
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*
    MODAL BORRAR TALLER */}

        {mostrarModalBorrarTaller && (
          <div className="modal-overlay" onClick={cerrarModalBorrarTaller}>
            <div className="modal-delete" onClick={(e) => e.stopPropagation()}>
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
                  Esta acción es permanente y no se podrá deshacer. Todos los
                  datos asociados al taller podrían perderse.
                </p>
              </div>

              {error && (
                <p className="config-error modal-form-error">{error}</p>
              )}

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
                  disabled={guardando}
                >
                  {guardando ? "Borrando..." : "Borrar definitivamente"}
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
