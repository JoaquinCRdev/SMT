import "../../../styles/components/layout/auth/registerPersonal.css";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const RegisterPersonal = () => {
  return (
    <div id="containerRegisterPersonal">
      <div id="ladoIzquierdoPersonal">
        <h1>Cuentanos sobre ti y el taller donde trabajas</h1>
        <div className="form-containerPersonal">
          <div className="form-gridPersonal">

            <div className="input-groupPersonal">
              <label>Nombre completo</label>
              <input type="text" />
            </div>

            <div className="input-groupPersonal">
              <label>Carga</label>
              <input type="text" />
            </div>

            <div className="input-groupPersonal">
              <label>Contrasenia</label>
              <input type="password" />
            </div>

            <div className="input-groupPersonal">
              <label>correo electronico</label>
              <input type="email" />
            </div>

            <div className="input-groupPersonal">
              <label>taller</label>
              <input type="text" />
            </div>

            <div className="input-groupPersonal ">
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
