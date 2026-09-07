import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../../styles/components/layout/sidebar.css";
import i18n from "../../i18n/i18n";

const Sidebar = () => {
  const [, setIdioma] = useState(i18n.language);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  // Escucha los cambios de idioma realizados desde cualquier componente
  i18n.on("languageChanged", (nuevoIdioma) => {
    setIdioma(nuevoIdioma);
  });

  return (
    <aside id="sidebarhome">

      {/* ================= LOGO ================= */}
      <div id="headerSidebar">

        <img
          src="/logoblanco.png"
          alt="Logo"
          id="logohome"
        />

        {/* HAMBURGUESA */}
        <button
          id="botonHamburguesa"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>


      {/* ================= MENÚ ================= */}
      <div
        id="botoneshome"
        className={menuAbierto ? "menu-abierto" : ""}
      >

        {/* INICIO */}
        <NavLink
          to="/home"
          end
          className="botonhome"
          onClick={cerrarMenu}
        >
          <img
            className="imageniconoshome icono-gris"
            src="/homegris.png"
            alt=""
          />

          <img
            className="imageniconoshome icono-naranja"
            src="/homenaranja.png"
            alt=""
          />

          {i18n.t("layout.sidebar.inicio")}
        </NavLink>


        {/* MIS MAQUINAS */}
        <NavLink
          to="/mismaquinas"
          className="botonhome"
          onClick={cerrarMenu}
        >
          <img
            className="imageniconoshome icono-gris"
            src="/mismaquinasgris.png"
            alt=""
          />

          <img
            className="imageniconoshome icono-naranja"
            src="/mismaquinasnaranja.png"
            alt=""
          />

          {i18n.t("layout.sidebar.mis_maquinas")}
        </NavLink>


        {/* MANTENIMIENTO */}
        <NavLink
          to="/mantenimiento"
          className="botonhome"
          onClick={cerrarMenu}
        >
          <img
            className="imageniconoshome icono-gris"
            src="/mantenimientosgris.png"
            alt=""
          />

          <img
            className="imageniconoshome icono-naranja"
            src="/mantenimientosnaranja.png"
            alt=""
          />

          {i18n.t("layout.sidebar.mantenimientos")}
        </NavLink>


        {/* CONFIGURACION */}
        <NavLink
          to="/configuracion"
          className="botonhome"
          onClick={cerrarMenu}
        >
          <img
            className="imageniconoshome icono-gris"
            src="/configuraciongris.png"
            alt=""
          />

          <img
            className="imageniconoshome icono-naranja"
            src="/configuracionaranja.png"
            alt=""
          />

          {i18n.t("layout.sidebar.configuracion")}
        </NavLink>


        {/* HISTORIAL */}
        <NavLink
          to="/historial"
          className="botonhome"
          onClick={cerrarMenu}
        >
          <img
            className="imageniconoshome icono-gris"
            src="/historialgris.png"
            alt=""
          />

          <img
            className="imageniconoshome icono-naranja"
            src="/historialnaranja.png"
            alt=""
          />

          {i18n.t("layout.sidebar.historial")}
        </NavLink>


        {/* NOTIFICACIONES */}
        <NavLink
          to="/notificaciones"
          className="botonhome"
          onClick={cerrarMenu}
        >
          <img
            className="imageniconoshome icono-gris"
            src="/notificacionesgris.png"
            alt=""
          />

          <img
            className="imageniconoshome icono-naranja"
            src="/notificacionesnaranja.png"
            alt=""
          />

          {i18n.t("layout.sidebar.notificaciones")}
        </NavLink>


        {/* AYUDA */}
        <NavLink
          to="/ayuda"
          className="botonhome"
          onClick={cerrarMenu}
        >
          <img
            className="imageniconoshome icono-gris"
            src="/ayudagris.png"
            alt=""
          />

          <img
            className="imageniconoshome icono-naranja"
            src="/ayudanaranja.png"
            alt=""
          />

          {i18n.t("layout.sidebar.ayuda")}
        </NavLink>

      </div>


      {/* ================= CERRAR SESIÓN ================= */}
      <Link
        to=""
        id="botoncerrarsesion"
        onClick={cerrarMenu}
      >
        <img
          className="icono-cerrar-gris"
          src="/cerrarsesiongris.png"
          alt=""
        />

        <img
          className="icono-cerrar-naranja"
          src="/cerrarsesionnaranja.png"
          alt=""
        />

        {i18n.t("layout.sidebar.cerrar_sesion")}
      </Link>

    </aside>
  );
};

export default Sidebar;
