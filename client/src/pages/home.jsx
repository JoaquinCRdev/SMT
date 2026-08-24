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

          <button className="botonmas">
            +
          </button>

          <button className="botonnotificaciones">
            <img
              src="notificacionesgris.png"
              alt="Notificaciones"
            />
          </button>

          <div className="separadorheader"></div>

          <div className="usuarioheader">

            <div className="textousuario">
              <strong>Administrador</strong>
              <span>Admin ⌄ </span>
            </div>

            <div className="iconousuario">
              <img
                src="personita.png"
                alt="Perfil"
              />
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