import { useEffect, useState } from "react";
import i18n from "../../i18n/i18n";
import api from "../../api/axios";

const PersonalSection = ({ workshop, isOwner }) => {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPersonal = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/workshops/mine/members");
      setPersonal(data);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar el personal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const ownerId = workshop?.owner?._id || workshop?.owner;
  const esOwnerDelMiembro = (member) => String(member._id) === String(ownerId);
  const getRoleLabel = (member) => {
    if (esOwnerDelMiembro(member)) return "Propietario";
    return member.role === "admin" ? "Administrador" : "Colaborador";
  };

  // Modal agregar
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", apellido: "", email: "", password: "", rol: "user" });
  const [errorNuevo, setErrorNuevo] = useState("");
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  const abrirAgregar = () => {
    setNuevo({ nombre: "", apellido: "", email: "", password: "", rol: "user" });
    setErrorNuevo("");
    setMostrarAgregar(true);
  };
  const cerrarAgregar = () => setMostrarAgregar(false);
  const handleNuevo = (e) => setNuevo((p) => ({ ...p, [e.target.name]: e.target.value }));

  const agregarPersonal = async (e) => {
    e.preventDefault();
    setErrorNuevo("");
    const nombreCompleto = `${nuevo.nombre.trim()} ${nuevo.apellido.trim()}`.trim();

    if (nombreCompleto.length < 3) return setErrorNuevo("El nombre debe tener al menos 3 caracteres");
    if (nuevo.password.length < 8) return setErrorNuevo("La contraseña debe tener al menos 8 caracteres");

    setGuardandoNuevo(true);
    try {
      await api.post("/workshops/mine/members", {
        name: nombreCompleto,
        email: nuevo.email,
        password: nuevo.password,
        role: nuevo.rol,
      });
      await fetchPersonal();
      cerrarAgregar();
    } catch (err) {
      setErrorNuevo(err.response?.data?.message || "No se pudo agregar al personal");
    } finally {
      setGuardandoNuevo(false);
    }
  };

  // Modal editar
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState(null);
  const [edit, setEdit] = useState({ nombre: "", rol: "user", activo: true, password: "" });
  const [errorEdit, setErrorEdit] = useState("");
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const abrirEditar = (member) => {
    setMiembroEditando(member);
    setEdit({ nombre: member.name, rol: member.role, activo: member.isActive, password: "" });
    setErrorEdit("");
    setMostrarEditar(true);
  };
  const cerrarEditar = () => {
    setMostrarEditar(false);
    setMiembroEditando(null);
  };
  const handleEdit = (e) => {
    const { name, value } = e.target;
    setEdit((p) => ({ ...p, [name]: value }));
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setErrorEdit("");

    if (edit.nombre.trim().length < 3) return setErrorEdit("El nombre debe tener al menos 3 caracteres");
    if (edit.password && edit.password.length < 8)
      return setErrorEdit("La contraseña debe tener al menos 8 caracteres");

    setGuardandoEdit(true);
    try {
      const payload = { name: edit.nombre, role: edit.rol, isActive: edit.activo };
      if (edit.password) payload.password = edit.password;

      await api.patch(`/workshops/mine/members/${miembroEditando._id}`, payload);
      await fetchPersonal();
      cerrarEditar();
    } catch (err) {
      setErrorEdit(err.response?.data?.message || "No se pudo editar el usuario");
    } finally {
      setGuardandoEdit(false);
    }
  };

  return (
    <>
      <section className="section-card">
        <div className="section-header">
          <h2 className="section-title">{i18n.t("pages.configuracion.configs.personal.h2")}</h2>
          <p className="section-subtitle">{i18n.t("pages.configuracion.configs.personal.p")}</p>
        </div>

        {error && <p id="errorPersonal">{error}</p>}

        {loading ? (
          <p>Cargando personal...</p>
        ) : (
          <div className="staff-grid">
            {personal.map((staff) => (
              <div key={staff._id} className="staff-card">
                <div className="staff-header">
                  <div className="staff-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="staff-meta">
                    <span className="staff-name">{staff.name}</span>
                    <span className="staff-role">{getRoleLabel(staff)}</span>
                  </div>
                </div>

                <div className="staff-status">
                  <span className="status-label">{i18n.t("pages.configuracion.configs.personal.estado")}</span>
                  <div className="status-indicator">
                    <span className={`dot ${staff.isActive ? "active" : "inactive"}`} />
                    {staff.isActive
                      ? i18n.t("pages.configuracion.configs.personal.activo", "Activo")
                      : i18n.t("pages.configuracion.configs.personal.inactivo", "Inactivo")}
                  </div>
                </div>

                {isOwner && !esOwnerDelMiembro(staff) && (
                  <>
                    <button className="btn-modify" onClick={() => abrirEditar(staff)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {i18n.t("pages.configuracion.configs.personal.modificar")}
                    </button>
                    <button className="btn-modify-icon-only" onClick={() => abrirEditar(staff)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <button className="btn-add-staff" type="button" onClick={abrirAgregar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {i18n.t("pages.configuracion.configs.personal.agregar")}
          </button>
        )}
      </section>

      {mostrarAgregar && (
        <div className="modal-overlay" onClick={cerrarAgregar}>
          <div className="modal-personal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-personal-header">
              <div>
                <h2 className="modal-personal-title">Agregar personal</h2>
                <p className="modal-personal-subtitle">
                  Se le va a crear una cuenta con estos datos para que pueda acceder.
                </p>
              </div>
              <button type="button" className="modal-close" onClick={cerrarAgregar} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={agregarPersonal}>
              {errorNuevo && <p id="errorModalPersonal">{errorNuevo}</p>}

              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" name="nombre" type="text" placeholder="Ej. Juan" value={nuevo.nombre} onChange={handleNuevo} autoComplete="off" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="apellido">Apellido</label>
                  <input id="apellido" name="apellido" type="text" placeholder="Ej. Pérez" value={nuevo.apellido} onChange={handleNuevo} autoComplete="off" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" placeholder="ejemplo@mail.com" value={nuevo.email} onChange={handleNuevo} autoComplete="off" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="password">Contraseña</label>
                  <input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" value={nuevo.password} onChange={handleNuevo} autoComplete="new-password" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="rol">Rol</label>
                  <select id="rol" name="rol" value={nuevo.rol} onChange={handleNuevo}>
                    <option value="admin">Administrador</option>
                    <option value="user">Colaborador</option>
                  </select>
                </div>
              </div>

              <div className="modal-personal-actions">
                <button type="button" className="btn-modal-cancel" onClick={cerrarAgregar}>Cancelar</button>
                <button type="submit" className="btn-modal-save" disabled={guardandoNuevo}>
                  {guardandoNuevo ? "Agregando..." : "Agregar personal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarEditar && miembroEditando && (
        <div className="modal-overlay" onClick={cerrarEditar}>
          <div className="modal-personal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-personal-header">
              <div>
                <h2 className="modal-personal-title">Editar {miembroEditando.name}</h2>
                <p className="modal-personal-subtitle">El email no se puede modificar: {miembroEditando.email}</p>
              </div>
              <button type="button" className="modal-close" onClick={cerrarEditar} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={guardarEdicion}>
              {errorEdit && <p id="errorModalPersonal">{errorEdit}</p>}

              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label htmlFor="editNombre">Nombre completo</label>
                  <input id="editNombre" name="nombre" type="text" value={edit.nombre} onChange={handleEdit} />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="editRol">Rol</label>
                  <select id="editRol" name="rol" value={edit.rol} onChange={handleEdit}>
                    <option value="admin">Administrador</option>
                    <option value="user">Colaborador</option>
                  </select>
                </div>
                <div className="modal-form-group">
                  <label htmlFor="editPassword">Nueva contraseña (opcional)</label>
                  <input id="editPassword" name="password" type="password" placeholder="Dejar vacío para no cambiarla" value={edit.password} onChange={handleEdit} autoComplete="new-password" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="editActivo">Estado</label>
                  <select
                    id="editActivo"
                    name="activo"
                    value={edit.activo ? "true" : "false"}
                    onChange={(e) => setEdit((p) => ({ ...p, activo: e.target.value === "true" }))}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-personal-actions">
                <button type="button" className="btn-modal-cancel" onClick={cerrarEditar}>Cancelar</button>
                <button type="submit" className="btn-modal-save" disabled={guardandoEdit}>
                  {guardandoEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalSection;