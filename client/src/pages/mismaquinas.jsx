import "../styles/pages/mismaquinas.css";
import { Link } from "react-router-dom";
import Sidebar from "../components/layout/sidebar.jsx";
import { useState } from "react";

const Mismaquinas = () => {
  const [activo, setActivo] = useState("maquinas");
  return (
    <div id="containermismaquinas">
      <Sidebar />

      <div id="ladomismaquinas">
        <div id="headermobile">
          <button
            onClick={() => setActivo("maquinas")}
          >
            Mis máquinas
          </button>

          <button
            className={activo === "otros" ? "activo" : ""}
            onClick={() => setActivo("otros")}
          >
            Otros
          </button>
        </div>

        <div id="primerdivmismaquinas">
          <button className="botonmas">+</button>
        </div>

        <div id="segundodivmismaquinas">
          <p>2/4 Maquinas</p>
        </div>

        <div id="listamaquinas">
          <div className="tarjetamaquina">
            <div className="imagentarjeta">
              <span>Img</span>
            </div>

            <div className="infomaquina">
              <h2>Nombre</h2>
              <div className="etiquetas">
                <span>maquina</span>
                <span>año</span>
              </div>
              <p className="fecha">📅 dd/mm/aaaa</p>
            </div>

            {/* <div className="descripcionmaquina">
              <h3>descripcion</h3>
              <div className="linea"></div>
              <div className="linea"></div>
              <div className="linea"></div>
            </div> */}

            <button className="estado">Estado</button>
          </div>

          <div className="tarjetamaquina">
            <div className="imagentarjeta">
              <span>Img</span>
            </div>

            <div className="infomaquina">
              <h2>Pinacho S-40</h2>
              <div className="etiquetas">
                <span>Torno</span>
                <span>2018</span>
              </div>
              <p className="fecha">📅 14/03/2021</p>
            </div>

            {/* <div className="descripcionmaquina">
              <p>
                Torno convencional para operaciones de torneado, cilindrado,
                refrentado y roscado.
              </p>
            </div> */}

            <button className="estado">Operativo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mismaquinas;
