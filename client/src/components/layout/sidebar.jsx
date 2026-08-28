import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../../styles/components/layout/sidebar.css";

const Sidebar = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

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

          Inicio
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

          Mis maquinas
        </NavLink>


        {/* MANTENIMIENTOS */}
        <NavLink
          to="/mantenimientos"
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

          Mantenimientos
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

          Configuracion
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

          Historial
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

          Notificaciones
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

          Ayuda
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

        Cerrar Sesion
      </Link>

    </aside>
  );
};

export default Sidebar;