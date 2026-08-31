import "../styles/pages/mantenimiento.css";
import { useState, useRef } from "react";
import Sidebar from "../components/layout/sidebar";

const Mantenimiento = () => {
  const [form, setForm] = useState({
    nombre: "Pinacho S-90",
    tipo: "maquina",
    marca: "Pinacho",
    serie: "PS90-2024-005",
    descripcion:
      "Máquina convencional para operaciones de torneado, cilindrado y roscado.",
    fecha: "2024-04-14",
    estado: "operativo",
  });

  const [fotos, setFotos] = useState([]);

  const inputFotoRef = useRef(null);

  const cambiarCampo = (campo) => (e) => {
    setForm({
      ...form,
      [campo]: e.target.value,
    });
  };

  const abrirSelectorFotos = () => {
    inputFotoRef.current.click();
  };

  const agregarFotos = (e) => {
    const archivos = Array.from(e.target.files);

    const nuevasFotos = archivos.map((archivo) =>
      URL.createObjectURL(archivo)
    );

    setFotos((fotosActuales) => [
      ...fotosActuales,
      ...nuevasFotos,
    ]);

    e.target.value = "";
  };

  const quitarFoto = (indice) => {
    setFotos((fotosActuales) =>
      fotosActuales.filter((_, i) => i !== indice)
    );
  };

  const actualizarDatos = () => {
    console.log("Datos listos para actualizar:", form);
  };

  const eliminarDatos = () => {
    setForm({
      nombre: "",
      tipo: "",
      marca: "",
      serie: "",
      descripcion: "",
      fecha: "",
      estado: "",
    });

    setFotos([]);
  };

  return (
    <div id="containermantenimiento">
      <Sidebar />

      <div id="ladomantenimiento">

        <div id="botonesarribamantenimiento">
          <button className="botonvolver" type="button">
            <img src="flechaatrasgris.png" alt="Volver" />
          </button>

          <h2 id="titulobarramantenimiento">
            <span>/mantenimiento</span> (Registro)
          </h2>

          <button className="botonmas" type="button">
            +
          </button>
        </div>

        <div id="pasosregistro">
          <div className="paso pasoactivo">
            <span className="pasonumero">1</span>
            <span className="pasotexto">Mantenimiento</span>
          </div>
        </div>

        <div id="contenidomantenimiento">

          <main id="columnaformulario">

            <h3>Completa los datos del mantenimiento</h3>

            <div id="filacampos">

              <div className="columnacampos">

                <div className="campo">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={cambiarCampo("nombre")}
                  />
                </div>

                <div className="campo">
                  <label>Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={cambiarCampo("tipo")}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="maquina">Máquina</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="campo">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={form.marca}
                    onChange={cambiarCampo("marca")}
                  />
                </div>

                <div className="campo">
                  <label>N.° de serie</label>
                  <input
                    id="inputserie"
                    type="text"
                    value={form.serie}
                    onChange={cambiarCampo("serie")}
                  />
                </div>

              </div>

              <div className="columnacampos">

                <div className="campo">
                  <label>Descripción</label>
                  <textarea
                    rows="4"
                    value={form.descripcion}
                    onChange={cambiarCampo("descripcion")}
                  />
                </div>

                <div className="campo">
                  <label>Fecha de mantenimiento</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={cambiarCampo("fecha")}
                  />
                </div>

                <div className="campo">
                  <label>Estado</label>
                  <select
                    value={form.estado}
                    onChange={cambiarCampo("estado")}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="operativo">Operativo</option>
                    <option value="mantenimiento">
                      En mantenimiento
                    </option>
                    <option value="baja">De baja</option>
                  </select>
                </div>

              </div>
            </div>

            <div id="seccionfotos">

              <p>Fotos</p>

              <div id="filafotos">

                {fotos.map((foto, indice) => (
                  <div className="fotomaquina" key={indice}>
                    <img
                      src={foto}
                      alt={`Foto ${indice + 1}`}
                    />

                    <button
                      className="botonquitarfoto"
                      type="button"
                      onClick={() => quitarFoto(indice)}
                    >
                      <img
                        src="cerrargris.png"
                        alt="Quitar"
                      />
                    </button>
                  </div>
                ))}

                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={agregarFotos}
                />

                <button
                  id="botonagregarfoto"
                  type="button"
                  onClick={abrirSelectorFotos}
                >
                  <img
                    src="camaragris.png"
                    alt=""
                  />

                  <span>
                    Agregar
                    <br />
                    foto
                  </span>
                </button>

              </div>
            </div>

            <div className="espaciadorpie"></div>

          </main>

          <aside id="resumenmaquina">

            <h2>Resumen</h2>

            <div id="placamaquina">

              <p id="etiquetaplaca">
                Placa de identificación
              </p>

              <p id="nombreplaca">
                {form.nombre}
              </p>

              <p id="tipoplaca">
                {form.tipo === "maquina" && "Máquina"}
                {form.tipo === "otro" && "Otro"}
              </p>

              <div id="serieplaca">
                <span>N.° serie</span>
                <span>{form.serie}</span>
              </div>

            </div>

            <div id="estadomaquina">
              <span>Estado:</span>

              <b className={`estado ${form.estado}`}>
                {form.estado === "operativo" && "Operativo"}
                {form.estado === "mantenimiento" &&
                  "En mantenimiento"}
                {form.estado === "baja" && "De baja"}
              </b>
            </div>

            <button
              id="botonactualizar"
              type="button"
              onClick={actualizarDatos}
            >
              Actualizar
            </button>

            <button
              id="botoneliminar"
              type="button"
              onClick={eliminarDatos}
            >
              Eliminar
            </button>

          </aside>

        </div>
      </div>
    </div>
  );
};

export default Mantenimiento;
