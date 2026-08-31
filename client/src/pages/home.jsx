import "../styles/pages/home.css";
import { Link, NavLink } from "react-router-dom";
import Sidebar from "../components/layout/sidebar";

const Home = () => {
  return (
    <div id="containerhome">
      <Sidebar />
      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div id="ladohome">

        {/* ================= BARRA SUPERIOR ================= */}
        <div id="botonesarribahome">

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

          <div className="separadorheader"></div>

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


        {/* ================= CONTENIDO HOME ================= */}
        <div id="contenidohome">

          {/* COLUMNA PRINCIPAL */}
          <main id="columnaprincipalhome">

            {/* BIENVENIDA */}
            <div id="bienvenidahome">

              <div className="iconobienvenida">
                <img
                  src="personita.png"
                  alt=""
                />
              </div>

              <div>
                <h1>¡Hola, Administrador!</h1>
                <p>Bienvenido de nuevo</p>
              </div>

            </div>


            {/* RESUMEN GENERAL */}
            <section id="resumengeneral">

              <h2>Resumen general</h2>

              <div id="tarjetasresumen">

                {/* TALLERES */}
                <div className="tarjetaresumen">

                  <div>
                    <p>Talleres</p>
                    <strong>12</strong>
                    <span>Activos</span>
                  </div>

                  <img
                    src="mismaquinasnaranja.png"
                    alt=""
                  />

                </div>


                {/* MAQUINAS */}
                <div className="tarjetaresumen">

                  <div>
                    <p>Máquinas</p>
                    <strong>24</strong>
                    <span>Registradas</span>
                  </div>

                  <img
                    src="mismaquinasnaranja.png"
                    alt=""
                  />

                </div>


                {/* ORDENES */}
                <div className="tarjetaresumen">

                  <div>
                    <p>Órdenes</p>
                    <strong>58</strong>
                    <span>En proceso</span>
                  </div>

                  <img
                    src="mantenimientosnaranja.png"
                    alt=""
                  />

                </div>


                {/* PERSONAL */}
                <div className="tarjetaresumen">

                  <div>
                    <p>Personal</p>
                    <strong>15</strong>
                    <span>Miembros</span>
                  </div>

                  <img
                    src="iconopersonal.png"
                    alt=""
                  />

                </div>

              </div>

            </section>


            {/* ACTIVIDAD RECIENTE */}
            <section id="actividadhome">

              <h2>Actividad reciente</h2>

              <div id="tablaactividad">

                {/* CABECERA */}
                <div className="filaactividad encabezadoactividad">

                  <span>TALLER</span>
                  <span>ACTIVIDAD</span>
                  <span>FECHA</span>
                  <span>ESTADO</span>

                </div>


                {/* FILA 1 */}
                <div className="filaactividad">

                  <span>Taller Central</span>

                  <span>Nueva orden #1258</span>

                  <span>30/05/2024</span>

                  <span>
                    <b className="estado progreso">
                      En progreso
                    </b>
                  </span>

                </div>


                {/* FILA 2 */}
                <div className="filaactividad">

                  <span>Taller Norte</span>

                  <span>Mantenimiento máquina</span>

                  <span>29/05/2024</span>

                  <span>
                    <b className="estado completado">
                      Completado
                    </b>
                  </span>

                </div>


                {/* FILA 3 */}
                <div className="filaactividad">

                  <span>Taller Sur</span>

                  <span>Nuevo personal agregado</span>

                  <span>28/05/2024</span>

                  <span>
                    <b className="estado completado">
                      Completado
                    </b>
                  </span>

                </div>

              </div>

            </section>

          </main>


          {/* ================= ACCIONES RAPIDAS ================= */}
          <aside id="accionesrapidas">

            <h2>Acciones rápidas</h2>


            <button className="accionrapida">

              <div className="iconoaccion">
                <img
                  src="nuevaorden.png"
                  alt=""
                />
              </div>

              <span>Nueva orden</span>

            </button>


            <button className="accionrapida">

              <div className="iconoaccion">
                <img
                  src="mismaquinasnaranja.png"
                  alt=""
                />
              </div>

              <span>
                Registrar
                <br />
                máquina
              </span>

            </button>


            <button className="accionrapida">

              <div className="iconoaccion">
                <img
                  src="iconopersonal.png"
                  alt=""
                />
              </div>

              <span>
                Agregar
                <br />
                personal
              </span>

            </button>


            <button className="accionrapida">

              <div className="iconoaccion">
                <img
                  src="reportesnaranja.png"
                  alt=""
                />
              </div>

              <span>
                Ver
                <br />
                reportes
              </span>

            </button>

          </aside>

        </div>

      </div>

    </div>
  );
};

export default Home;