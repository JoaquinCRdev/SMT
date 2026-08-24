import "../styles/pages/registrarTaller.css";
import { NavLink } from "react-router-dom";

const RegistrarTaller = () => {
  return (
    <div id="RegistrarTaller">

      <button id="botonvolver">
        <NavLink to="/mismaquinas">← Volver</NavLink>
      </button>

      <div id="containerRegistrarTaller">

        <h1>Completa los datos de la maquina</h1>

        <div id="dropZone">
          <img src="subirimagen.svg" alt="Subir imagen" />
          <p>Drag and Drop</p>
          <span>or browse</span>
        </div>

        <form id="containerRegistrarTallerForm">

          <div className="campo">
            <label>Nombre</label>
            <input type="text" />
          </div>

          <div className="fila">

            <div className="campo mitad">
              <label>Tipo</label>
              <input type="text" />
            </div>

            <div className="campo mitad">
              <label>Año</label>
              <input type="number" />
            </div>

          </div>

          <div className="fila">

            <div className="campo mitad">
              <label>Marca</label>
              <input type="text" />
            </div>

            <div className="campo mitad">
              <label>N° serie</label>
              <input type="text" />
            </div>

          </div>

          <div className="campo">
            <label>Descripción</label>
            <textarea rows="4"></textarea>
          </div>

          <div className="campo">
            <label>Ficha técnica</label>

            <label className="upload">
              Upload file (.pdf)
              <input type="file" accept=".pdf" hidden />
            </label>
          </div>

          <div className="campo">
            <label>
              Plan de mantenimiento (puedes modificarlo luego)
            </label>

            <select defaultValue="">
              <option value="" disabled>
                ▼ Selecciona un plan
              </option>

              <option>Permanente</option>
              <option>Mensual</option>
              <option>Anual</option>
            </select>

            <a href="/">ver info sobre planes.</a>

          </div>

          <button id="botonRegistrarTaller">

            <img
              src="iconoagregarmaquina.svg"
              alt="Agregar"
            />

            Agregar maquina

          </button>

        </form>

      </div>

    </div>
  );
};

export default RegistrarTaller;