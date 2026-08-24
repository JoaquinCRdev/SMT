import "../styles/pages/inicio.css";
import { Link } from "react-router-dom";

const Inicio = () => {
  return (
    <div id="containerInicio">
      <div id="parteBlanca">
        <div id="contenido-parte-blanca">
        <h1>Bienvenidos a</h1>
        <img id="logo" src="/logoblanco.png" alt="" />
        <p>Tu taller, tu informacion, todo en un solo lugar.</p>
        </div>
      </div>

      <div id="formDiv">


        <div id="contenedorRegistro">
          <h1 id="tituloRegistro">Crea tu cuenta</h1>
          <div id="divRegistrar">
            <Link className="linkRegistro" to="/registerAdmin">
              Admin
            </Link>
            <Link className="linkRegistro" to="/registerPersonal">
              Personal
            </Link>
          </div>
        </div>



        <div id="divisor">
          <div id="linea1"></div>
          <h2 id="o">O</h2>
          <div id="linea2"></div>
        </div>


        <div id="contenedorIniciarSesion">
          <h1 id="tituloIniciarSesion">¿Tienes una cuenta?</h1>
          <Link id="botonIniciodeSesión" to="/login">
            Iniciar Sesión
          </Link>
        </div>


      </div>
    </div>
  );
};

export default Inicio;