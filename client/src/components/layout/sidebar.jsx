import { useState } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/components/layout/sidebar.css";
import i18n from "../../i18n/i18n";
import { useAuth } from "../../context/AuthContext";
import { useWorkshop } from "../../context/WorkshopContext";
import { etiquetaRol } from "../../utils/roles";

const Sidebar = () => {
  const [, setIdioma] = useState(i18n.language);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, logout } = useAuth();
  // El workshop ya lo carga WorkshopProvider para toda la app, así que el
  // nombre del taller sale de ahí sin pedir /workshops/mine en cada página.
  const { workshop } = useWorkshop();

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  // Antes esto era un <Link to=""> que no hacía nada: el botón de cerrar
  // sesión existía pero nunca llamaba a logout(), por eso no se podía
  // cambiar de cuenta.
  const handleLogout = async () => {
    cerrarMenu();
    await logout();
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


      {/* ================= CUENTA ================= */}
      {user && (
        <div id="cuentaSidebar">

          <div className="avatar-circle-sidebar">
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

          <div className="cuenta-datos">
            <span className="cuenta-nombre" title={user.name || user.email}>
              {user.name || user.email}
            </span>

            <span className="cuenta-rol">{etiquetaRol(user.role)}</span>

            {workshop?.name && (
              <span className="cuenta-taller" title={workshop.name}>
                {workshop.name}
              </span>
            )}
          </div>

        </div>
      )}


      {/* ================= CERRAR SESIÓN ================= */}
      <button
        type="button"
        id="botoncerrarsesion"
        onClick={handleLogout}
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
      </button>

    </aside>
  );
};

export default Sidebar;
