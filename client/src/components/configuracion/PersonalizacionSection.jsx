import { NavLink } from "react-router-dom";
import i18n from "../../i18n/i18n";

const PersonalizacionSection = ({
  modoOscuro,
  toggleModoOscuro,
  tamanoGrande,
  toggleTamano,
  cambiarIdioma,
}) => {
  return (
    <section className="section-card">
      <div className="personalizacion-grid">
        <div className="sub-card">
          <span className="sub-card-title">
            {i18n.t("pages.configuracion.configs.plan.title", "Plan actual")}
          </span>

          <div className="plan-box">
            <div className="plan-info">
              <div className="plan-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                </svg>
              </div>
              <div className="plan-details">
                <span className="plan-name">
                  {i18n.t("pages.configuracion.configs.plan.basico.name")}
                </span>
                <span className="plan-desc">
                  {i18n.t("pages.configuracion.configs.plan.basico.description")}
                </span>
              </div>
            </div>

            <NavLink className="btn-outline-orange" to="/planes">
              {i18n.t("pages.configuracion.configs.plan.basico.actualizar")}
            </NavLink>
          </div>
        </div>

        <button className="toggle-mode" type="button" onClick={toggleModoOscuro} aria-pressed={modoOscuro}>
          {modoOscuro
            ? i18n.t("pages.configuracion.configs.modo.claro")
            : i18n.t("pages.configuracion.configs.modo.oscuro")}
        </button>

        <div className="sub-card">
          <span className="sub-card-title">{i18n.t("pages.configuracion.configs.fuente.h2")}</span>
          <button className="toggle-mode" type="button" onClick={toggleTamano} aria-pressed={tamanoGrande}>
            {tamanoGrande
              ? i18n.t("pages.configuracion.configs.fuente.sizes.grande")
              : i18n.t("pages.configuracion.configs.fuente.sizes.pequeño")}
          </button>
        </div>

        <div className="sub-card">
          <span className="sub-card-title">
            {i18n.t("pages.configuracion.configs.idioma.title", "Idioma")}
          </span>

          <div className="select-box">
            <div className="select-content">
              <select id="input-idioma" value={i18n.language?.substring(0, 2)} onChange={cambiarIdioma}>
                <option value="es">{i18n.t("pages.configuracion.configs.idioma.es")}</option>
                <option value="en">{i18n.t("pages.configuracion.configs.idioma.en")}</option>
                <option value="de">{i18n.t("pages.configuracion.configs.idioma.de")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalizacionSection;