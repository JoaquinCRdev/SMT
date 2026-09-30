import "../styles/pages/mismaquinas.css";
import Sidebar from "../components/layout/sidebar.jsx";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js"

const Mismaquinas = () => {
  const [activo, setActivo] = useState("maquinas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState("crear"); // "crear" | "editar"
  const [itemEditandoId, setItemEditandoId] = useState(null);
  const [maquinas, setMaquinas] = useState([]);
  const [otros, setOtros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const convertirEstadoFrontend = (status) => {
  const equivalencias = {
    active: "operativo",
    maintenance: "mantenimiento",
    inactive: "baja",
  };
  return equivalencias[status] || "operativo";
};

const convertirEstadoBackend = (estado) => {
  const equivalencias = {
    operativo: "active",
    mantenimiento: "maintenance",
    baja: "inactive",
  };
  return equivalencias[estado] || "active";
};

const convertirDesdeBackend = (item) => ({
  id: item._id,
  nombre: item.name,
  tipo: item.tipo,
  marca: item.brand,
  modelo: item.model,
  nroSerie: item.serialNumber,
  descripcion: item.description || "",
  estado: convertirEstadoFrontend(item.status),
});
  
  const obtenerMaquinas = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/machine");
    const items = (response.data.items || []).map(convertirDesdeBackend);

    setMaquinas(items.filter((item) => item.tipo === "maquina"));
    setOtros(items.filter((item) => item.tipo === "otro"));
  } catch (error) {
    console.error("Error al obtener máquinas:", error);
    setError(
      error.response?.data?.message || "No se pudieron cargar los equipos."
    );
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  obtenerMaquinas();
}, []);

  // Formulario y fotos
const [form, setForm] = useState({
  nombre: "",
  tipo: "",
  marca: "",
  modelo: "",
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
    setError("");
setForm({
  nombre: "",
  tipo: activo === "maquinas" ? "maquina" : "otro",
  marca: "",
  modelo: "",
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
  setError("");
  setForm({
    nombre: item.nombre || "",
    tipo: item.tipo || "",
    marca: item.marca || "",
    modelo: item.modelo || "",
    serie: item.nroSerie || "",
    descripcion: item.descripcion || "",
    fecha: "",
    estado: item.estado || "operativo",
  });
  setFotos([]);
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
const guardarEquipo = async () => {
  // Validación en el frontend
  if (form.nombre.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres.");
  if (!form.tipo) return setError("Seleccioná un tipo.");
  if (form.marca.trim().length < 2) return setError("La marca debe tener al menos 2 caracteres.");
  if (form.modelo.trim().length < 2) return setError("El modelo debe tener al menos 2 caracteres.");
  if (form.serie.trim().length < 5) return setError("El N.° de serie debe tener al menos 5 caracteres.");

  try {
    setGuardando(true);
    setError("");

    const payload = {
      name: form.nombre,
      tipo: form.tipo,
      brand: form.marca,
      model: form.modelo,
      serialNumber: form.serie,
      description: form.descripcion,
      status: convertirEstadoBackend(form.estado),
    };

    let response;

    if (modoEdicion === "crear") {
      response = await api.post("/machine", payload);
    } else {
      response = await api.put(`/machine/${itemEditandoId}`, payload);
    }

    console.log("Equipo guardado:", response.data);

    setModalAbierto(false);
    setItemEditandoId(null);

    await obtenerMaquinas();
  } catch (error) {
    console.error("Error al guardar equipo:", error.response?.data);
    setError(
      error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "No se pudo guardar el equipo."
    );
  } finally {
    setGuardando(false); // <- esto era lo que faltaba
  }
};

const eliminarEquipo = async (id) => {
  const confirmar = window.confirm(
    "¿Seguro que querés eliminar este equipo?"
  );

  if (!confirmar) return;

  try {
    setError("");

    await api.delete(`/machine/${id}`);

    await obtenerMaquinas();
  } catch (error) {
    console.error("Error al eliminar equipo:", error);

    setError(
      error.response?.data?.message ||
        "No se pudo eliminar el equipo."
    );
  }
};

  const formatearEstado = (est) => {
    if (est === "operativo") return "Operativo";
    if (est === "mantenimiento") return "En Mantenimiento";
    if (est === "baja") return "De baja";
    return est;
  };

  const itemsAMostrar = activo === "maquinas" ? maquinas : otros;

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
          {error && <p style={{ color: "#dc3545", margin: "10px 0" }}>{error}</p>}
{loading && <p>Cargando...</p>}
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

                <button onClick={() => eliminarEquipo(item.id)}>
  Eliminar
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
  <label>Modelo</label>
  <input
    type="text"
    value={form.modelo}
    onChange={cambiarCampo("modelo")}
    placeholder="Ingresá el modelo"
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
{error && (
  <p style={{ color: "#dc3545", fontSize: "14px", margin: "0 0 10px" }}>
    {error}
  </p>
)}
                  <button
  type="button"
  onClick={guardarEquipo}
  disabled={guardando}
>
  {guardando
    ? "Guardando..."
    : modoEdicion === "crear"
    ? "Guardar"
    : "Actualizar"}
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