import "../../../styles/components/layout/auth/login.css";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div id="containerLogin">
      <div id="ladoIzquierdoLogin">

        <img
    className="logoMobileLogin"
    src="/logocelu.png"
    alt="Logo SMT"
  />
        <h1>Registra el taller que administras</h1>
        <div className="form-containerLogin">
          <div className="form-gridLogin">
            <div className="input-groupLogin">
              <label>Correo Electrónico</label>
              <input type="email" />
            </div>

            <div className="input-groupLogin">
              <label>Contraseña</label>
              <input type="password" />
            </div>
          </div>
        </div>

        <button>Registrar</button>
        <p>
          ¿Tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>

      <div id="ladoDerechoLogin">
        <img src="/inicioSesion.svg" alt="Imagen decorativa" />
      </div>
    </div>

  );
}
    




export default Login;
