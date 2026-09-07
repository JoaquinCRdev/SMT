import "../styles/pages/registrarTaller.css";
import { NavLink } from "react-router-dom";

const RegistrarTaller = () => {
  return (
    <div id="RegistrarTaller">

      <button id="botonvolver" type="button">
        <NavLink to="/mismaquinas">← Volver</NavLink>
      </button>

      <div id="containerRegistrarTaller">

        <form id="containerRegistrarTallerForm">

          {/* =========================
              INFORMACIÓN DEL TALLER
          ========================== */}
          <div className="panel-taller informacion-taller">

            <h1>Información de tu taller</h1>

            <div className="campo">
              <label htmlFor="nombreTaller">
                Nombre del taller
              </label>

              <input
                id="nombreTaller"
                type="text"
                placeholder="Ej: Taller Central"
              />
            </div>

            <div className="campo">
              <label htmlFor="descripcionTaller">
                Descripción
              </label>

              <textarea
                id="descripcionTaller"
                rows="4"
                placeholder="Contá brevemente qué servicios realiza tu taller..."
              ></textarea>
            </div>

            <div className="campo">
              <label htmlFor="direccionTaller">
                Dirección
              </label>

              <input
                id="direccionTaller"
                type="text"
                placeholder="Ej: Av.libertad 123"
              />
            </div>

            <div className="campo">
              <label htmlFor="telefonoTaller">
                Teléfono
              </label>

              <input
                id="telefonoTaller"
                type="tel"
                placeholder="Ej: 11 1234-5678"
              />
            </div>

          </div>


          {/* =========================
              INFORMACIÓN DERECHA
          ========================== */}
          <div className="panel-taller panel-derecho">

            {/* LOGO */}
            <div className="seccion-logo">

              <h2>Logo del taller</h2>

              <label htmlFor="logoTaller" className="logo-upload">

                <div className="logo-icon">
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

                <span className="logo-upload-title">
                  Subir logo
                </span>

                <span className="logo-upload-info">
                  .JPG, .PNG (Max 2MB)
                </span>

                <input
                  id="logoTaller"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  hidden
                />

              </label>

            </div>


            {/* ADMINISTRADOR */}
            <div className="seccion-administrador">

              <h2>Administrador</h2>

              <div className="campo">
                <label htmlFor="nombreAdministrador">
                  Nombre completo
                </label>

                <input
                  id="nombreAdministrador"
                  type="text"
                  placeholder="Nombre y apellido"
                />
              </div>

              <div className="campo">
                <label htmlFor="gmailAdministrador">
                  Gmail
                </label>

                <input
                  id="gmailAdministrador"
                  type="email"
                  placeholder="ejemplo@gmail.com"
                />
              </div>

            </div>

          </div>


          {/* =========================
              BOTÓN
          ========================== */}
          <button
            id="botonRegistrarTaller"
            type="submit"
          >
            Registrar taller
          </button>

        </form>

      </div>

    </div>
  );
};

export default RegistrarTaller;