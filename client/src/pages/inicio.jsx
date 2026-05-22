import "../styles/pages/inicio.css";
import { Link } from "react-router-dom";

const Inicio = () => {
  return (
    <div id="container">
      <div id="parteBlanca">
        <h1>Bienvenidos a</h1>
        <img id="logo" src="/logo.png" alt="" />
        <p>Tu espacio donde administras tus maquinas mas facil</p>
      </div>

      <div id="formDiv">
        <h1 id="tituloRegistro">Crea Tu Cuenta</h1>
        <div id="divRegistrar">
          <Link className="linkRegistro" to="/register">
            Admin
          </Link>
          <Link className="linkRegistro" to="/register">
            Personal
          </Link>
        </div>
        <div id="divisor">
          <div id="linea1"></div>
          <h2 id="o">O</h2>
          <div id="linea2"></div>
        </div>
        <h1 id="tituloIniciarSesion">¿Tienes una cuenta?</h1>
        <Link id="botonIniciodeSesión" to="/login">
          Iniciar Sesión
        </Link>
      </div>
    </div>
  );
};

export default Inicio;
