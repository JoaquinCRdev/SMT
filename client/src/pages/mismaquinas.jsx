import "../styles/pages/mismaquinas.css";
import Sidebar from "../components/layout/sidebar.jsx";
import { useState, useRef } from "react";

const Mismaquinas = () => {
  const [activo, setActivo] = useState("maquinas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState("crear"); // "crear" | "editar"
  const [itemEditandoId, setItemEditandoId] = useState(null);

  // Listas de datos en estado local para permitir edición dinámica
  const [maquinas, setMaquinas] = useState([
    {
      id: 1,
      nombre: "Pinacho S-40",
      tipo: "maquina",
      marca: "Pinacho",
      nroSerie: "SN-2018-9941",
      descripcion: "Torno convencional para operaciones de torneado, cilindrado, refrentado y roscado.",
      estado: "operativo",
      imagen: "https://via.placeholder.com/120"
    },
    {
      id: 2,
      nombre: "Fresadora Universal",
      tipo: "maquina",
      marca: "Bridgeport",
      nroSerie: "SN-2020-3312",
      descripcion: "Fresadora para mecanizado de piezas de alta precisión y corte vertical.",
      estado: "mantenimiento",
      imagen: "https://via.placeholder.com/120"
    }
  ]);

  const [otros, setOtros] = useState([
    {
      id: 1,
      nombre: "Foco LED High Bay",
      tipo: "otro",
      marca: "Philips",
      nroSerie: "FL-8832-X",
      descripcion: "Campana LED industrial de 200W para iluminación de alto galpón.",
      estado: "operativo",
      imagen: "https://via.placeholder.com/120"
    },
    {
      id: 2,
      nombre: "Panel Solar 450W",
      tipo: "otro",
      marca: "Canadian Solar",
      nroSerie: "PS-450-9921",
      descripcion: "Módulo fotovoltaico monocristalino de alta eficiencia.",
      estado: "operativo",
      imagen: "https://via.placeholder.com/120"
    },
    {
      id: 3,
      nombre: "Canaleta Industrial",
      tipo: "otro",
      marca: "Tigre",
      nroSerie: "CN-1020-A",
      descripcion: "Canaleta metálica galvanizada para bajada de desagües del techo principal.",
      estado: "baja",
      imagen: "https://via.placeholder.com/120"
    }
  ]);

  // Formulario y fotos
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    marca: "",
    serie: "",
    descripcion: "",
    fecha: "",
    estado: "",
  });
  const [fotos, setFotos] = useState([]);
  const inputFotoRef = useRef(null);

  // Abrir Modal para crear
  const abrirModalCrear = () => {
    setModoEdicion("crear");
    setItemEditandoId(null);
    setForm({
      nombre: "",
      tipo: activo === "maquinas" ? "maquina" : "otro",
      marca: "",
      serie: "",
      descripcion: "",
      fecha: "",
      estado: "operativo",
    });
    setFotos([]);
    setModalAbierto(true);
  };

  // Abrir Modal para editar una tarjeta
  const abrirModalEditar = (item) => {
    setModoEdicion("editar");
    setItemEditandoId(item.id);
    setForm({
      nombre: item.nombre || "",
      tipo: item.tipo || (activo === "maquinas" ? "maquina" : "otro"),
      marca: item.marca || "",
      serie: item.nroSerie || "",
      descripcion: item.descripcion || "",
      fecha: item.fecha || "",
      estado: item.estado || "operativo",
    });
    setFotos(item.imagen ? [item.imagen] : []);
    setModalAbierto(true);
  };

  const cambiarCampo = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value });
  };

  const abrirSelectorFotos = () => {
    if (inputFotoRef.current) inputFotoRef.current.click();
  };

  const agregarFotos = (e) => {
    const archivos = Array.from(e.target.files);
    const urls = archivos.map((archivo) => URL.createObjectURL(archivo));
    setFotos((prev) => [...prev, ...urls]);
  };

  const quitarFoto = (indice) => {
    setFotos((prev) => prev.filter((_, i) => i !== indice));
  };

  const cerrarModal = () => setModalAbierto(false);

  // Guardar o Actualizar
  const actualizarDatos = () => {
    const nuevoElemento = {
      id: modoEdicion === "editar" ? itemEditandoId : Date.now(),
      nombre: form.nombre,
      tipo: form.tipo,
      marca: form.marca,
      nroSerie: form.serie,
      descripcion: form.descripcion,
      fecha: form.fecha,
      estado: form.estado,
      imagen: fotos[0] || "",
    };

    const actualizarLista = (lista) => {
      if (modoEdicion === "editar") {
        return lista.map((item) => (item.id === itemEditandoId ? nuevoElemento : item));
      }
      return [...lista, nuevoElemento];
    };

    if (form.tipo === "maquina") {
      setMaquinas(actualizarLista(maquinas));
      if (modoEdicion === "editar" && activo === "otros") {
        setOtros(otros.filter((item) => item.id !== itemEditandoId));
      }
    } else {
      setOtros(actualizarLista(otros));
      if (modoEdicion === "editar" && activo === "maquinas") {
        setMaquinas(maquinas.filter((item) => item.id !== itemEditandoId));
      }
    }

    cerrarModal();
  };

  const itemsAMostrar = activo === "maquinas" ? maquinas : otros;

  const formatearEstado = (est) => {
    if (est === "operativo") return "Operativo";
    if (est === "mantenimiento") return "En Mantenimiento";
    if (est === "baja") return "De baja";
    return est;
  };

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
          <button className="botonmas" onClick={abrirModalCrear}>
            +
          </button>
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
              <div className="imagentarjeta">
                {item.imagen ? (
                  <img src={item.imagen} alt={item.nombre} />
                ) : (
                  <span>Img</span>
                )}
              </div>

              <div className="infomaquina">
                <h2>{item.nombre}</h2>
                <div className="etiquetas">
                  <span>Marca: {item.marca}</span>
                  <span>S/N: {item.nroSerie}</span>
                </div>
              </div>

              <div className="descripcionmaquina">
                <p>{item.descripcion}</p>
              </div>

              <div className="acciones-tarjeta">
                <button className={`estado ${item.estado}`}>
                  {formatearEstado(item.estado)}
                </button>
                <button
                  className="boton-editar"
                  type="button"
                  onClick={() => abrirModalEditar(item)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="overlay-modal" onClick={cerrarModal}>
          <div className="modal-wrapper">
            <button className="boton-cerrar-x" onClick={cerrarModal} type="button">
              ✕
            </button>

            <div className="contenido-modal" onClick={(e) => e.stopPropagation()}>
              <div id="contenidomantenimiento">
                <main id="columnaformulario">
                  <h3>
                    {modoEdicion === "editar"
                      ? "Editar datos del equipo"
                      : "Completa los datos del mantenimiento"}
                  </h3>

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
                          rows="2"
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
                          <img src={foto} alt={`Foto ${indice + 1}`} />

                          <button
                            className="botonquitarfoto"
                            type="button"
                            onClick={() => quitarFoto(indice)}
                          >
                            <img src="cerrargris.png" alt="Quitar" />
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
                        <img src="camaragris.png" alt="" />
                        <span>
                          Agregar
                          <br />
                          foto
                        </span>
                      </button>
                    </div>
                  </div>
                </main>

                <aside id="resumenmaquina">
                  <div>
                    <h2>Resumen</h2>

                    <div id="placamaquina">
                      <p id="etiquetaplaca">Placa de identificación</p>
                      <p id="nombreplaca">{form.nombre || "—"}</p>
                      <p id="tipoplaca">
                        {form.tipo === "maquina" && "Máquina"}
                        {form.tipo === "otro" && "Otro"}
                      </p>

                      <div id="serieplaca">
                        <span>N.° serie</span>
                        <span>{form.serie || "—"}</span>
                      </div>
                    </div>

                    <div id="estadomaquina">
                      <span>Estado:</span>
                      <b className={`estado ${form.estado}`}>
                        {formatearEstado(form.estado) || "—"}
                      </b>
                    </div>
                  </div>

                  <button
                    id="botonactualizar"
                    type="button"
                    onClick={actualizarDatos}
                  >
                    {modoEdicion === "editar" ? "Guardar cambios" : "Actualizar"}
                  </button>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mismaquinas;