import "../styles/pages/mismaquinas.css";
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Sidebar from "../components/layout/sidebar.jsx";

const ESTADOS_FRONTEND = {
  active: "operativo",
  maintenance: "mantenimiento",
  inactive: "baja",
};

const ESTADOS_BACKEND = {
  operativo: "active",
  mantenimiento: "maintenance",
  baja: "inactive",
};

const TIPOS = [
  { value: "maquina", label: "Máquina" },
  { value: "otro", label: "Otro" },
];

const ETIQUETA_ESTADO = {
  operativo: "Operativo",
  mantenimiento: "En Mantenimiento",
  baja: "De baja",
};

// Espejo de las restricciones de machine.validator.js, para no mandar al servidor requests que van a rebotar con un 400.
const REGLAS = {
  nombre: { min: 15, max: 100, label: "El nombre" },
  marca: { min: 2, max: 50, label: "La marca" },
  modelo: { min: 2, max: 50, label: "El modelo" },
  serie: { min: 5, max: 50, label: "El número de serie" },
};

const formVacio = (tipo) => ({
  nombre: "",
  tipo,
  marca: "",
  modelo: "",
  serie: "",
  descripcion: "",
  estado: "operativo",
});

const convertirDesdeBackend = (item) => ({
  id: item._id,
  nombre: item.name,
  tipo: item.tipo,
  marca: item.brand,
  modelo: item.model,
  serie: item.serialNumber,
  descripcion: item.description || "",
  estado: ESTADOS_FRONTEND[item.status] || "operativo",
});

const validarForm = (form) => {
  for (const [campo, regla] of Object.entries(REGLAS)) {
    const largo = form[campo].trim().length;
    if (largo < regla.min) {
      return `${regla.label} debe tener al menos ${regla.min} caracteres`;
    }
    if (largo > regla.max) {
      return `${regla.label} no puede superar ${regla.max} caracteres`;
    }
  }
  if (form.descripcion.length > 500) {
    return "La descripción no puede superar 500 caracteres";
  }
  return "";
};

const Mismaquinas = () => {
  const [activo, setActivo] = useState("maquinas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState("crear"); // "crear" | "editar"
  const [itemEditandoId, setItemEditandoId] = useState(null);
  const [maquinas, setMaquinas] = useState([]);
  const [otros, setOtros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(() => formVacio("maquina"));

  const listar = () => api.get("/machine", { params: { limit: 100 } });

  const distribuir = (items) => {
    // Con dos `filter` de igualdad estricta, una máquina sin `tipo` (las
    // anteriores al commit cefa0e2) no entraba en ninguno de los dos buckets y
    // desaparecía de la pantalla. Solo "otro" va a la pestaña de Otros; todo lo
    // demás, incluido `undefined`, es una máquina.
    setMaquinas(
      items.filter((i) => i.tipo !== "otro").map(convertirDesdeBackend),
    );
    setOtros(items.filter((i) => i.tipo === "otro").map(convertirDesdeBackend));
  };

  const mensajeError = (err, porDefecto) =>
    err.response?.data?.message || porDefecto;

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const { data } = await listar();
        if (cancelado) return;
        distribuir(data.items ?? []);
      } catch (err) {
        if (cancelado) return;
        setError(mensajeError(err, "No se pudieron cargar los equipos."));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  // Recarga posterior a guardar o eliminar, sin volver a mostrar el spinner.
  const recargar = async () => {
    try {
      const { data } = await listar();
      distribuir(data.items ?? []);
    } catch (err) {
      setError(mensajeError(err, "No se pudieron cargar los equipos."));
    }
  };

  const cambiarCampo = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const abrirModalCrear = () => {
    setModoEdicion("crear");
    setItemEditandoId(null);
    setForm(formVacio(activo === "maquinas" ? "maquina" : "otro"));
    setError("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setModoEdicion("editar");
    setItemEditandoId(item.id);
    setForm({
      nombre: item.nombre || "",
      tipo: item.tipo || "maquina",
      marca: item.marca || "",
      modelo: item.modelo || "",
      serie: item.serie || "",
      descripcion: item.descripcion || "",
      estado: item.estado || "operativo",
    });
    setError("");
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);

  const guardarEquipo = async () => {
    const problema = validarForm(form);
    if (problema) {
      setError(problema);
      return;
    }

    const payload = {
      name: form.nombre.trim(),
      tipo: form.tipo,
      brand: form.marca.trim(),
      model: form.modelo.trim(),
      serialNumber: form.serie.trim(),
      description: form.descripcion.trim(),
      status: ESTADOS_BACKEND[form.estado] || "active",
    };

    try {
      setGuardando(true);
      setError("");

      if (modoEdicion === "crear") {
        await api.post("/machine", payload);
      } else {
        await api.put(`/machine/${itemEditandoId}`, payload);
      }

      setModalAbierto(false);
      setItemEditandoId(null);
      await recargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el equipo."));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarEquipo = async (id) => {
    if (!window.confirm("¿Seguro que querés eliminar este equipo?")) return;

    try {
      setError("");
      await api.delete(`/machine/${id}`);
      await recargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo eliminar el equipo."));
    }
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
          <p>
            {itemsAMostrar.length}{" "}
            {activo === "maquinas" ? "Máquinas" : "Elementos en Otros"}
          </p>
        </div>

        {error && <p id="errormismaquinas">{error}</p>}

        <div id="listamaquinas">
          {cargando && <p id="cargandomismaquinas">Cargando equipos...</p>}

          {!cargando && itemsAMostrar.length === 0 && (
            <p id="vaciomismaquinas">
              {activo === "maquinas"
                ? "Todavía no cargaste máquinas."
                : "Todavía no cargaste elementos en Otros."}
            </p>
          )}

          {itemsAMostrar.map((item) => (
            <div className="tarjetamaquina" key={item.id}>
              <div className="imagentarjeta">
                <span>Img</span>
              </div>

              <div className="infomaquina">
                <h2>{item.nombre}</h2>
                <div className="etiquetas">
                  <span>Marca: {item.marca}</span>
                  <span>S/N: {item.serie}</span>
                </div>
              </div>

              <div className="acciones-tarjeta">
                <span className={`estado ${item.estado}`}>
                  {ETIQUETA_ESTADO[item.estado] || item.estado}
                </span>
                <button
                  className="boton-editar"
                  type="button"
                  onClick={() => abrirModalEditar(item)}
                >
                  Editar
                </button>

                <button type="button" onClick={() => eliminarEquipo(item.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalAbierto && (
        <div className="overlay-modal" onClick={cerrarModal}>
          <div className="modal-wrapper">
            <button
              className="boton-cerrar-x"
              onClick={cerrarModal}
              type="button"
            >
              ✕
            </button>

            <div
              className="contenido-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div id="contenidomantenimiento">
                <main id="columnaformulario">
                  <h3>
                    {modoEdicion === "editar"
                      ? "Editar datos del equipo"
                      : "Cargá los datos del equipo"}
                  </h3>

                  {error && <p id="errormodalmismaquinas">{error}</p>}

                  <div id="filacampos">
                    <div className="columnacampos">
                      <div className="campo">
                        <label>Nombre</label>
                        <input
                          type="text"
                          value={form.nombre}
                          onChange={cambiarCampo("nombre")}
                          minLength={REGLAS.nombre.min}
                          maxLength={REGLAS.nombre.max}
                          placeholder="Mínimo 15 caracteres"
                        />
                      </div>

                      <div className="campo">
                        <label>Tipo</label>
                        <select
                          value={form.tipo}
                          onChange={cambiarCampo("tipo")}
                        >
                          {TIPOS.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="campo">
                        <label>Marca</label>
                        <input
                          type="text"
                          value={form.marca}
                          onChange={cambiarCampo("marca")}
                          minLength={REGLAS.marca.min}
                          maxLength={REGLAS.marca.max}
                        />
                      </div>

                      <div className="campo">
                        <label>Modelo</label>
                        <input
                          type="text"
                          value={form.modelo}
                          onChange={cambiarCampo("modelo")}
                          minLength={REGLAS.modelo.min}
                          maxLength={REGLAS.modelo.max}
                        />
                      </div>

                      <div className="campo">
                        <label>N.° de serie</label>
                        <input
                          id="inputserie"
                          type="text"
                          value={form.serie}
                          onChange={cambiarCampo("serie")}
                          minLength={REGLAS.serie.min}
                          maxLength={REGLAS.serie.max}
                        />
                      </div>
                    </div>

                    <div className="columnacampos">
                      <div className="campo">
                        <label>Descripción</label>
                        <textarea
                          rows={2}
                          value={form.descripcion}
                          maxLength={500}
                          onChange={cambiarCampo("descripcion")}
                        />
                      </div>

                      <div className="campo">
                        <label>Estado</label>
                        <select
                          value={form.estado}
                          onChange={cambiarCampo("estado")}
                        >
                          <option value="operativo">Operativo</option>
                          <option value="mantenimiento">
                            En mantenimiento
                          </option>
                          <option value="baja">De baja</option>
                        </select>
                      </div>
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
                        {TIPOS.find((t) => t.value === form.tipo)?.label}
                      </p>

                      <div id="serieplaca">
                        <span>N.° serie</span>
                        <span>{form.serie || "—"}</span>
                      </div>
                    </div>

                    <div id="estadomaquina">
                      <span>Estado:</span>
                      <b className={`estado ${form.estado}`}>
                        {ETIQUETA_ESTADO[form.estado] || "—"}
                      </b>
                    </div>
                  </div>

                  <button
                    id="botonactualizar"
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
