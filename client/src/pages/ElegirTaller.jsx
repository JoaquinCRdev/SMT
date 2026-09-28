import "../styles/pages/elegirTaller.css";
import { Link } from "react-router-dom";

const opciones = [
  {
    to: "/crearTaller",
    titulo: "Crear un taller",
    descripcion:
      "Registrá tu taller y quedás como administrador. Vas a poder invitar a tu personal y administrar sus máquinas.",
    accion: "Quiero crear un taller",
  },
  {
    to: "/asociarseTaller",
    titulo: "Unirme a un taller",
    descripcion:
      "Ingresá el código que te compartió el administrador del taller y solicitá incorporarte a su equipo.",
    accion: "Tengo un código",
  },
];

const ElegirTaller = () => {
  return (
    <div id="contenedorElegirTaller">
      <div id="cardElegirTaller">
        <h1>¿Cómo querés empezar?</h1>
        <p id="subtituloElegirTaller">
          Todavía no pertenecés a ningún taller. Elegí una opción para
          continuar.
        </p>

        <div id="opcionesElegirTaller">
          {opciones.map((opcion) => (
            <Link
              key={opcion.to}
              to={opcion.to}
              className="opcionElegirTaller"
              id={`opcion${opcion.to.replaceAll("/", "")}`}
            >
              <h2>{opcion.titulo}</h2>
              <p>{opcion.descripcion}</p>
              <span>{opcion.accion}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElegirTaller;
