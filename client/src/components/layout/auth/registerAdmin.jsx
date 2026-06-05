import "../../../styles/components/layout/auth/registerAdmin.css";
import { Link } from "react-router-dom";

const RegisterAdmin = () => {
  return (
    <div id="containerRegisterAdmin">
      <div id="ladoIzquierdoAdmin">
        <h1>Registra el taller que administras</h1>
        <div className="form-containerAdmin">
          <div className="form-gridAdmin">
            <div className="input-groupAdmin">
              <label>Nombre</label>
              <input type="text" />
            </div>

            <div className="input-groupAdmin">
              <label>Razon Social</label>
              <input type="text" />
            </div>

            <div className="input-groupAdmin">
              <label>CUIT/RFC/NIT</label>
              <input type="text" />
            </div>

            <div className="input-groupAdmin">
              <label>Tipo</label>

              <select>
                <option></option>
                <option>Taller</option>
                <option>Empresa</option>
              </select>
            </div>

            <div className="input-groupAdmin">
              <label>Direccion</label>
              <input type="text" />
            </div>

            <div className="input-groupAdmin">
              <label>Ciudad</label>
              <input type="text" />
            </div>

            <div className="input-groupAdmin">
              <label>Codigo Postal</label>
              <input type="text" />
            </div>

            <div className="input-groupAdmin">
              <label>Provincia</label>
              <input type="text" />
            </div>
          </div>
        </div>

        <button>Registrar</button>
        <p>
          ¿Tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>

      <div id="ladoDerechoAdmin">
        <img src="/ladoDerecho.svg" alt="Imagen decorativa" />
      </div>
    </div>
  );
};

export default RegisterAdmin;
