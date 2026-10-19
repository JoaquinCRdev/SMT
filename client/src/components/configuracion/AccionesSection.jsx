import { useState } from "react";
import i18n from "../../i18n/i18n";
import api from "../../api/axios";

const AccionesSection = ({ workshop, refetchWorkshop, refetchProfile }) => {
  // Modificar
  const [mostrarModificar, setMostrarModificar] = useState(false);
  const [form, setForm] = useState({ nombre: "", direccion: "", telefono: "" });
  const [errorModificar, setErrorModificar] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrirModificar = () => {
    setForm({
      nombre: workshop?.name || "",
      direccion: workshop?.address || "",
      telefono: workshop?.phone || "",
    });
    setErrorModificar("");
    setMostrarModificar(true);
  };
  const cerrarModificar = () => setMostrarModificar(false);
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const guardarCambios = async (e) => {
    e.preventDefault();
    setErrorModificar("");

    if (form.nombre.trim().length < 3) {
      setErrorModificar("El nombre debe tener al menos 3 caracteres");
      return;
    }

    setGuardando(true);
    try {
      await api.patch(`/workshops/${workshop._id}`, {
        name: form.nombre,
        address: form.direccion,
        phone: form.telefono,
      });
      await refetchWorkshop();
      cerrarModificar();
    } catch (err) {
      setErrorModificar(err.response?.data?.message || "No se pudo modificar el taller");
    } finally {
      setGuardando(false);
    }
  };

  // Borrar
  const [mostrarBorrar, setMostrarBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const borrarTaller = async () => {
    setBorrando(true);
    try {
      await api.delete(`/workshops/${workshop._id}`);
      await refetchProfile();
      await refetchWorkshop();
      setMostrarBorrar(false);
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo borrar el taller");
      setBorrando(false);
    }
  };

  return (
    <>
      <section className="section-card">
        <div className="section-header">
          <h2 className="section-title">{i18n.t("pages.configuracion.configs.acciones.h2")}</h2>
          <p className="section-subtitle">{i18n.t("pages.configuracion.configs.acciones.p")}</p>
        </div>

        <div className="acciones-grid">
          <div className="action-card">
            <div className="action-card-header">
              <div className="action-icon-box orange">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div className="action-card-info">
                <span className="action-card-title">{i18n.t("pages.configuracion.configs.acciones.modificar.span")}</span>
                <span className="action-card-desc">{i18n.t("pages.configuracion.configs.acciones.modificar.descripcion")}</span>
              </div>
            </div>
            <div className="action-card-btn-container">
              <button className="btn-action-outline-orange" type="button" onClick={abrirModificar}>
                {i18n.t("pages.configuracion.configs.acciones.modificar.action")}
              </button>
            </div>
          </div>

          <div className="action-card">
            <div className="action-card-header">
              <div className="action-icon-box red">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div className="action-card-info">
                <span className="action-card-title">{i18n.t("pages.configuracion.configs.acciones.borrar.span")}</span>
                <span className="action-card-desc">{i18n.t("pages.configuracion.configs.acciones.borrar.descripcion")}</span>
              </div>
            </div>
            <div className="action-card-btn-container">
              <button className="btn-action-outline-red" type="button" onClick={() => setMostrarBorrar(true)}>
                {i18n.t("pages.configuracion.configs.acciones.borrar.action")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {mostrarModificar && (
        <div className="modal-overlay" onClick={cerrarModificar}>
          <div className="modal-taller" onClick={(e) => e.stopPropagation()}>
            <div className="modal-taller-header">
              <h2>Modificar taller</h2>
              <button type="button" className="modal-close" onClick={cerrarModificar} aria-label="Cerrar">×</button>
            </div>

            <form className="modal-taller-form" onSubmit={guardarCambios}>
              <div className="modal-taller-panel" style={{ gridColumn: "1 / -1" }}>
                <h3>Información de tu taller</h3>

                {errorModificar && <p id="errorModalPersonal">{errorModificar}</p>}

                <div className="campo-modal-taller">
                  <label htmlFor="nombreTallerModal">Nombre del taller</label>
                  <input id="nombreTallerModal" name="nombre" type="text" value={form.nombre} onChange={handleChange} />
                </div>
                <div className="campo-modal-taller">
                  <label htmlFor="direccionTallerModal">Dirección</label>
                  <input id="direccionTallerModal" name="direccion" type="text" value={form.direccion} onChange={handleChange} />
                </div>
                <div className="campo-modal-taller">
                  <label htmlFor="telefonoTallerModal">Teléfono</label>
                  <input id="telefonoTallerModal" name="telefono" type="tel" value={form.telefono} onChange={handleChange} />
                </div>
              </div>

              <div className="modal-taller-actions">
                <button type="button" className="btn-modal-cancel" onClick={cerrarModificar}>Cancelar</button>
                <button type="submit" className="btn-modal-save" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarBorrar && (
        <div className="modal-overlay" onClick={() => setMostrarBorrar(false)}>
          <div className="modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-delete-header">
              <div className="modal-delete-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <button type="button" className="modal-close" onClick={() => setMostrarBorrar(false)} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-delete-content">
              <h2 className="modal-delete-title">¿Querés borrar definitivamente el taller?</h2>
              <p className="modal-delete-text">
                Esta acción es permanente. Todos los miembros, incluido vos, van a quedar sin taller asignado.
              </p>
            </div>

            <div className="modal-delete-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setMostrarBorrar(false)}>Cancelar</button>
              <button type="button" className="btn-modal-delete" onClick={borrarTaller} disabled={borrando}>
                {borrando ? "Borrando..." : "Borrar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccionesSection;