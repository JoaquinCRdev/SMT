import "../../../styles/components/layout/auth/registerPersonal.css";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const RegisterPersonal = () => {
  return (
    <div id="containerRegisterPersonal">
      <div id="ladoIzquierdoPersonal">
        <h1>Cuentanos sobre ti y el taller donde trabajas</h1>
        <div className="form-container">
          <div className="form-grid">

            <div className="input-group">
              <label>Nombre completo</label>
              <input type="text" />
            </div>

            <div className="input-group">
              <label>Carga</label>
              <input type="text" />
            </div>

            <div className="input-group">
              <label>Contrasenia</label>
              <input type="password" />
            </div>

            <div className="input-group">
              <label>correo electronico</label>
              <input type="email" />
            </div>

            <div className="input-group">
              <label>taller</label>
              <input type="text" />
            </div>

            <div className="input-group">
              <label>Confirmar contrasenia</label>
              <input type="password" />
            </div>
          </div>
        </div>

        <button>ingresar</button>
      </div>

      <div id="ladoDerechoPersonal">
        <img src="/ladoDerecho.svg" alt="Imagen decorativa" />
      </div>
    </div>
  );
};

export default RegisterPersonal;
