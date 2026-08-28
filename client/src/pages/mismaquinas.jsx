import "../styles/pages/mismaquinas.css";
import { Link } from "react-router-dom";
import Sidebar from "../components/layout/sidebar.jsx";
import { useState } from "react";

const Mismaquinas = () => {
  const [activo, setActivo] = useState("maquinas");

  // Lista de máquinas con estado "Operativo" / "No Operativo"
  const listaMaquinas = [
    {
      id: 1,
      nombre: "Pinacho S-40",
      marca: "Pinacho",
      nroSerie: "SN-2018-9941",
      descripcion: "Torno convencional para operaciones de torneado, cilindrado, refrentado y roscado.",
      estado: "Operativo",
      imagen: "https://via.placeholder.com/120"
    },
    {
      id: 2,
      nombre: "Fresadora Universal",
      marca: "Bridgeport",
      nroSerie: "SN-2020-3312",
      descripcion: "Fresadora para mecanizado de piezas de alta precisión y corte vertical.",
      estado: "No Operativo",
      imagen: "https://via.placeholder.com/120"
    }
  ];

  // Lista de otros con estado "Operativo" / "No Operativo"
  const listaOtros = [
    {
      id: 1,
      nombre: "Foco LED High Bay",
      marca: "Philips",
      nroSerie: "FL-8832-X",
      descripcion: "Campana LED industrial de 200W para iluminación de alto galpón.",
      estado: "Operativo",
      imagen: "https://via.placeholder.com/120"
    },
    {
      id: 2,
      nombre: "Panel Solar 450W",
      marca: "Canadian Solar",
      nroSerie: "PS-450-9921",
      descripcion: "Módulo fotovoltaico monocristalino de alta eficiencia.",
      estado: "Operativo",
      imagen: "https://via.placeholder.com/120"
    },
    {
      id: 3,
      nombre: "Canaleta Industrial",
      marca: "Tigre",
      nroSerie: "CN-1020-A",
      descripcion: "Canaleta metálica galvanizada para bajada de desagües del techo principal.",
      estado: "No Operativo",
      imagen: "https://via.placeholder.com/120"
    }
  ];

  const itemsAMostrar = activo === "maquinas" ? listaMaquinas : listaOtros;

  return (
    <div id="containermismaquinas">
      <Sidebar />

      <div id="ladomismaquinas">
        <div id="headermobile">
          <button
            className={activo === "maquinas" ? "activo" : ""}
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
          <p>
            {itemsAMostrar.length}{" "}
            {activo === "maquinas" ? "Máquinas" : "Elementos en Otros"}
          </p>
        </div>

        <div id="listamaquinas">
          {itemsAMostrar.map((item) => (
            <div className="tarjetamaquina" key={item.id}>
              {/* Imagen */}
              <div className="imagentarjeta">
                {item.imagen ? (
                  <img src={item.imagen} alt={item.nombre} />
                ) : (
                  <span>Img</span>
                )}
              </div>

              {/* Nombre, Marca y Nro de Serie */}
              <div className="infomaquina">
                <h2>{item.nombre}</h2>
                <div className="etiquetas">
                  <span>Marca: {item.marca}</span>
                  <span>S/N: {item.nroSerie}</span>
                </div>
              </div>

              {/* Descripción */}
              <div className="descripcionmaquina">
                <p>{item.descripcion}</p>
              </div>

              {/* Botón de Estado con clase dinámica */}
              <button
                className={`estado ${
                  item.estado === "Operativo" ? "estado-op" : "estado-noop"
                }`}
              >
                {item.estado}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Mismaquinas;