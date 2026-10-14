import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "../styles/pages/mantenimiento.css";
import Sidebar from "../components/layout/sidebar";

// `value` es lo que se guarda en el estado y lo que decide la frecuencia; `dias` es lo que se manda como customDays cuando el preset no existe en el backend (trimestral/semestral). Antes `value` era "custom" para Trimestral y Semestral y el resto del código comparaba contra el label, así que "cada N días" se pisaba siempre y todo terminaba en customDays: 90.
const PERIODOS = [
  { value: "daily", label: "Diario", dias: 1 },
  { value: "weekly", label: "Semanal", dias: 7 },
  { value: "monthly", label: "Mensual", dias: 30 },
  { value: "trimestral", label: "Trimestral", dias: 90 },
  { value: "semestral", label: "Semestral", dias: 180 },
  { value: "yearly", label: "Anual", dias: 365 },
  { value: "custom", label: "Personalizado", dias: null },
];

const PERIODO_POR_VALUE = Object.fromEntries(PERIODOS.map((p) => [p.value, p]));

// El backend solo conoce daily/weekly/monthly/yearly/custom, así que trimestral y semestral viajan como custom con su cantidad de días fija.
// Lo importante: los presets que el backend SÍ conoce tienen que guardar su frecuencia nativa y no mandar customDays. Si también ellos salían como custom, cada plan quedaba atado a la ventana de `custom` y la periodicidad elegida se perdía.
function buildFrecuencia(periodo, diasInput) {
  const preset = PERIODO_POR_VALUE[periodo];

  if (!preset) return null;

  if (periodo === "custom") {
    const dias = Number(diasInput);
    if (!Number.isInteger(dias) || dias < 1) return null;
    return { frequency: "custom", customDays: dias };
  }

  // 90 y 180 días no existen como frecuencia nativa.
  if (periodo === "trimestral" || periodo === "semestral") {
    return { frequency: "custom", customDays: preset.dias };
  }

  return { frequency: periodo };
}

// El backend solo acepta estos valores; los presets de 90/180 días llegan como "custom". Sirve para mostrar la periodicidad con un label legible.
function etiquetaPeriodo(plan) {
  if (plan.frequency !== "custom") return plan.frequency;

  // Solo 90 y 180 se reinterpretan como Trimestral/Semestral. Cualquier otro customDays (por ejemplo 45, o un 90 que en realidad era diario) queda como "custom" y conserva su número.
  if (plan.customDays === 90) return "trimestral";
  if (plan.customDays === 180) return "semestral";

  return "custom";
}

function etiquetaLegible(periodo) {
  return PERIODO_POR_VALUE[periodo]?.label ?? periodo;
}

const TASK_STATUS_LABEL = {
  pending: "Pendiente",
  in_progress: "En curso",
  done: "Completada",
};

function calcularProgreso(tasks = []) {
  if (!tasks.length) return 0;
  const hechas = tasks.filter((t) => t.status === "done").length;
  return Math.round((hechas / tasks.length) * 100);
}

function diasDeRetraso(nextDue) {
  if (!nextDue) return null;
  const dias = Math.ceil((new Date(nextDue) - new Date()) / 86400000);
  return dias < 0 ? Math.abs(dias) : null;
}

function nombreMaquina(machine) {
  if (!machine) return "Sin máquina";
  if (typeof machine === "string") return machine;
  return machine.name || "Sin máquina";
}

// Qué tab muestra este equipo. `tipo` se agregó después de que existieran máquinas, así que hay documentos sin el campo; se tratan como "maquina" para que ningún equipo se pierda. Solo "otro" va a la tab Otros.
function tipoDe(machine) {
  return machine?.tipo === "otro" ? "otro" : "maquina";
}

function iniciales(user) {
  if (!user) return "?";
  const base = user.name || user.email || "?";
  return base
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatearFecha(iso) {
  if (!iso) return "sin fecha";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MantenimientoApp() {
  const [vista, setVista] = useState("lista");
  const [tabActivo, setTabActivo] = useState("Maquinas");
  const [filtroGeneral, setFiltroGeneral] = useState("General");
  const [showFiltro, setShowFiltro] = useState(false);

  const [planes, setPlanes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [tareaPendiente, setTareaPendiente] = useState(null);

  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState({
    machineId: "",
    periodo: "daily",
    dias: 1,
    startDate: new Date().toISOString().slice(0, 10),
    tareas: [],
    nuevaTarea: "",
    asignados: [],
    mostrarAsignado: false,
  });
  const [showModal, setShowModal] = useState(false);
  const [nuevo, setNuevo] = useState({ machineId: "", title: "" });

  const cargarDatos = useCallback(async ({ limpiarError = true } = {}) => {
    if (limpiarError) setError("");
    try {
      const [planesRes, maquinasRes] = await Promise.all([
        api.get("/plans", { params: { limit: 100 } }),
        api.get("/machine", { params: { limit: 100 } }),
      ]);
      setPlanes(planesRes.data.items ?? []);
      setMaquinas(maquinasRes.data.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message || "No se pudo cargar el mantenimiento",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const [planesRes, maquinasRes] = await Promise.all([
          api.get("/plans", { params: { limit: 100 } }),
          api.get("/machine", { params: { limit: 100 } }),
        ]);
        if (cancelado) return;
        setPlanes(planesRes.data.items ?? []);
        setMaquinas(maquinasRes.data.items ?? []);
      } catch (err) {
        if (cancelado) return;
        setError(
          err.response?.data?.message || "No se pudo cargar el mantenimiento",
        );
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const cargarMiembros = useCallback(async () => {
    try {
      const res = await api.get("/workshops/mine/members");
      setMiembros(res.data ?? []);
    } catch {
      setMiembros([]);
    }
  }, []);

  // Cada tab muestra solo lo suyo. Antes `tabActivo` no se leía para renderizar nada, así que "Otros" era un botón que solo movía el resaltado y mostraba la misma lista que "Máquinas".
  const tipoActivo = tabActivo === "Otros" ? "otro" : "maquina";

  const maquinasVisibles = useMemo(
    () => maquinas.filter((m) => tipoDe(m) === tipoActivo),
    [maquinas, tipoActivo],
  );

  // La tab vacía casi siempre es porque el taller no cargó equipos de ese tipo, no porque no tenga mantenimientos. El mensaje dice cuál de las dos es.
  const sinEquiposEnEstaTab = maquinasVisibles.length === 0;

  // `getAllPlans` ya hace populate de `machineId.tipo`, así que el tipo del plan se puede leer sin pedir nada extra al backend.
  const planesVisibles = useMemo(
    () => planes.filter((p) => tipoDe(p.machineId) === tipoActivo),
    [planes, tipoActivo],
  );

  const activos = planesVisibles.filter((p) => p.status === "active");
  const programados = planesVisibles.filter((p) => p.status !== "active");

  // Filtraba por `p.title.includes(filtroGeneral)`, o sea que "Trimestral" solo alcanzaba a los planes que tuvieran esa palabra en el título. Ahora compara contra la frecuencia real.
  const filtrados = useMemo(() => {
    if (filtroGeneral === "General") return programados;
    return programados.filter((p) => etiquetaPeriodo(p) === filtroGeneral);
  }, [programados, filtroGeneral]);

  const abrirDetalle = (plan) => {
    setSeleccionado(plan);
    setForm({
      machineId: plan.machineId?._id ?? plan.machineId ?? "",
      periodo: etiquetaPeriodo(plan),
      dias: plan.customDays ?? 1,
      startDate: plan.startDate
        ? new Date(plan.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      tareas: (plan.tasks ?? []).map((t) => ({ ...t })),
      nuevaTarea: "",
      asignados: (plan.assignedTo ?? []).map((u) => u._id),
      mostrarAsignado: false,
    });
    cargarMiembros();
    setVista("detalle");
  };

  const abrirNuevo = () => {
    setSeleccionado(null);
    setForm({
      // Solo equipos de la tab activa: si se eligiera el primero de `maquinas` sin filtrar, desde "Otros" se abriría el formulario con una máquina.
      machineId: maquinasVisibles[0]?._id ?? "",
      periodo: "daily",
      dias: 1,
      startDate: new Date().toISOString().slice(0, 10),
      tareas: [],
      nuevaTarea: "",
      asignados: [],
      mostrarAsignado: false,
    });
    cargarMiembros();
    setShowModal(true);
  };

  const agregarTarea = () => {
    const title = form.nuevaTarea.trim();
    if (title.length < 5) return;
    setForm((f) => ({
      ...f,
      tareas: [
        ...f.tareas,
        { title, status: "pending", priority: "medium", _id: null },
      ],
      nuevaTarea: "",
    }));
  };

  const alternarTarea = async (idx) => {
    const tarea = form.tareas[idx];
    const nuevoStatus = tarea.status === "done" ? "pending" : "done";

    if (!tarea._id) {
      setForm((f) => ({
        ...f,
        tareas: f.tareas.map((t, i) =>
          i === idx ? { ...t, status: nuevoStatus } : t,
        ),
      }));
      return;
    }

    setTareaPendiente(tarea._id);
    try {
      const machineId = form.machineId || seleccionado?.machineId?._id;
      const res = await api.patch(
        `/machine/${machineId}/tasks/${tarea._id}/status`,
        { status: nuevoStatus },
      );
      setForm((f) => ({
        ...f,
        tareas: f.tareas.map((t) =>
          t._id === tarea._id ? { ...t, ...res.data, _id: tarea._id } : t,
        ),
      }));

      // El progreso de la lista se calculaba sobre `planes`, que no se tocaba: la barra quedaba en 0% hasta recargar la página entera.
      sincronizarTareaEnPlanes(tarea._id, res.data);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar la tarea");
    } finally {
      setTareaPendiente(null);
    }
  };

  const sincronizarTareaEnPlanes = (taskId, task) => {
    if (!seleccionado) return;

    setPlanes((prev) =>
      prev.map((p) => {
        if (p._id !== seleccionado._id) return p;

        return {
          ...p,
          tasks: (p.tasks ?? []).map((t) =>
            t._id === taskId ? { ...t, ...task } : t,
          ),
        };
      }),
    );
  };

  const alternarAsignado = (id) => {
    setForm((f) => ({
      ...f,
      asignados: f.asignados.includes(id)
        ? f.asignados.filter((x) => x !== id)
        : [...f.asignados, id],
    }));
  };

  const guardar = async () => {
    if (!form.machineId) {
      setError("Seleccioná una máquina");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const frecuencia = buildFrecuencia(form.periodo, form.dias);

      if (!frecuencia) {
        setError("Los días deben ser un número entero mayor a 0");
        return;
      }

      const { frequency, customDays } = frecuencia;
      const tareasNuevas = form.tareas
        .filter((t) => !t._id)
        .map((t) => ({ title: t.title }));

      const payload = {
        startDate: form.startDate,
        frequency,
        tasks: tareasNuevas,
        assignedTo: form.asignados,
      };
      if (customDays) payload.customDays = customDays;

      if (seleccionado) {
        await api.put(
          `/machine/${form.machineId}/plans/${seleccionado._id}`,
          payload,
        );
      } else {
        await api.post(`/machine/${form.machineId}/plans`, {
          ...payload,
          title:
            nuevo.title.trim() ||
            `Mantenimiento ${etiquetaLegible(form.periodo)}`,
        });
      }
      setShowModal(false);
      setVista("lista");
      await cargarDatos();
    } catch (err) {
      setError(
        err.response?.data?.message || "No se pudo guardar el mantenimiento",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!seleccionado) return;
    setGuardando(true);
    try {
      await api.delete(
        `/machine/${form.machineId || seleccionado.machineId?._id}/plans/${seleccionado._id}`,
      );
      setVista("lista");
      await cargarDatos();
    } catch (err) {
      setError(
        err.response?.data?.message || "No se pudo eliminar el mantenimiento",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoPlan = async (plan, status) => {
    const machineId = plan.machineId?._id ?? plan.machineId;
    const accion = status === "inactive" ? "pausar" : "reactivar";

    if (
      !window.confirm(
        status === "inactive"
          ? `¿Pausar "${plan.title}"? Deja de aparecer en los mantenimientos activos.`
          : `¿Reactivar "${plan.title}"?`,
      )
    ) {
      return;
    }

    try {
      setGuardando(true);
      setError("");
      await api.patch(`/machine/${machineId}/plans/${plan._id}/status`, {
        status,
      });

      // `planes` se recarga, pero `seleccionado` es estado aparte: sin esto la vista de detalle seguía mostrando el plan como activo.
      setSeleccionado((prev) =>
        prev && prev._id === plan._id ? { ...prev, status } : prev,
      );

      await cargarDatos();
    } catch (err) {
      setError(
        err.response?.data?.message || `No se pudo ${accion} el mantenimiento`,
      );
    } finally {
      setGuardando(false);
    }
  };

  const marcarRealizado = async () => {
    setGuardando(true);
    try {
      // El backend cierra las tareas pendientes y deja el registro en el historial, así que marcar el plan como hecho sí genera historial.
      await api.patch(
        `/machine/${form.machineId || seleccionado.machineId?._id}/plans/${seleccionado._id}/performed`,
        { performedAt: new Date().toISOString().slice(0, 10) },
      );
      setVista("lista");
      await cargarDatos();
    } catch (err) {
      setError(
        err.response?.data?.message || "No se pudo marcar como realizado",
      );
    } finally {
      setGuardando(false);
    }
  };

  const progresoForm = calcularProgreso(form.tareas);

  if (cargando) {
    return (
      <div className="contenedor-principal">
        <Sidebar />
        <div className="app">
          <div className="section">Cargando mantenimientos…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor-principal">
      <Sidebar />
      <div className="app">
        <div className="header">
          <div className="tabs">
            <button
              className={`tab ${tabActivo === "Maquinas" ? "active" : ""}`}
              onClick={() => setTabActivo("Maquinas")}
            >
              Máquinas
            </button>
            <button
              className={`tab ${tabActivo === "Otros" ? "active" : ""}`}
              onClick={() => setTabActivo("Otros")}
            >
              Otros
            </button>
          </div>
          <div className="filter">
            <div className="dropdown">
              <span
                className="chip dd"
                onClick={() => setShowFiltro(!showFiltro)}
              >
                {filtroGeneral} ∨
              </span>
              {showFiltro && (
                <div className="dropdown-menu">
                  {[
                    "General",
                    ...PERIODOS.filter((p) => p.value !== "custom").map(
                      (p) => p.value,
                    ),
                  ].map((op) => (
                    <div
                      key={op}
                      className={`dropdown-item ${filtroGeneral === op ? "active" : ""}`}
                      onClick={() => {
                        setFiltroGeneral(op);
                        setShowFiltro(false);
                      }}
                    >
                      {op === "General" ? op : etiquetaLegible(op)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <div className="alert">⚠ {error}</div>}

        {vista === "lista" ? (
          <>
            <div className="section">
              <div className="section-head">
                <button className="btn-black" onClick={abrirNuevo}>
                  + Agregar mantenimiento
                </button>
              </div>
              <div className="section-head">
                <div>
                  <div className="section-title">Activos</div>
                  <div className="section-sub">
                    {activos.length} mantenimientos
                  </div>
                </div>
              </div>
              <div className="grid">
                {activos.map((p) => {
                  const pct = calcularProgreso(p.tasks);
                  const atraso = diasDeRetraso(p.nextDue);
                  return (
                    <div key={p._id} className="card active">
                      <div className="card-top">
                        <span className="badge">
                          {nombreMaquina(p.machineId)}
                        </span>
                      </div>
                      <div className="card-title">{p.title}</div>
                      <div className="progress-wrap">
                        {atraso !== null && (
                          <div className="alert">⚠ Venció hace {atraso}d</div>
                        )}
                        <div className="progress-meta">
                          <span>{pct}%</span>
                          <span>avance</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn-detail"
                          onClick={() => abrirDetalle(p)}
                        >
                          Ver detalle
                        </button>
                        <button
                          className="btn-ghost"
                          disabled={guardando}
                          onClick={() => cambiarEstadoPlan(p, "inactive")}
                        >
                          Pausar
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!activos.length && (
                  <div className="section">
                    {sinEquiposEnEstaTab
                      ? "No hay equipos en esta pestaña. Agregalos desde Mis Máquinas."
                      : "No hay mantenimientos activos"}
                  </div>
                )}
              </div>
            </div>

            <div className="section">
              <div className="section-head">
                <div>
                  <div className="section-title">Pausados</div>
                  <div className="section-sub">
                    {filtrados.length} mantenimientos
                  </div>
                </div>
              </div>
              <div className="grid">
                {filtrados.map((p) => (
                  <div key={p._id} className="card">
                    <div className="card-top">
                      <span className="badge">
                        {nombreMaquina(p.machineId)}
                      </span>
                    </div>
                    <div className="card-title">{p.title}</div>
                    <div className="card-desc">
                      Próximo: {formatearFecha(p.nextDue)}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-detail"
                        onClick={() => abrirDetalle(p)}
                      >
                        Ver detalle
                      </button>
                      <button
                        className="btn-ghost"
                        disabled={guardando}
                        onClick={() => cambiarEstadoPlan(p, "active")}
                      >
                        Reanudar
                      </button>
                    </div>
                  </div>
                ))}
                {!filtrados.length && (
                  <div className="section">
                    {sinEquiposEnEstaTab
                      ? "No hay equipos en esta pestaña. Agregalos desde Mis Máquinas."
                      : "No hay mantenimientos pausados"}
                  </div>
                )}
              </div>
            </div>

            {showModal && (
              <div
                className="modal-overlay"
                onClick={() => setShowModal(false)}
              >
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Nuevo mantenimiento</h3>
                  <div className="modal-grid">
                    <div className="field">
                      <label>máquina</label>
                      <select
                        className="select"
                        value={nuevo.machineId}
                        onChange={(e) =>
                          setNuevo({ ...nuevo, machineId: e.target.value })
                        }
                        autoFocus
                      >
                        <option value="">Seleccioná una máquina</option>
                        {maquinasVisibles.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>título</label>
                      <input
                        className="input"
                        value={nuevo.title}
                        onChange={(e) =>
                          setNuevo({ ...nuevo, title: e.target.value })
                        }
                        placeholder="Ej: Mantenimiento Trimestral"
                      />
                    </div>
                    <div className="footer" style={{ marginTop: 0 }}>
                      <button
                        className="btn-ghost"
                        onClick={() => setShowModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-black"
                        disabled={guardando || !nuevo.machineId}
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            machineId: nuevo.machineId,
                          }));
                          setShowModal(false);
                          setVista("detalle");
                        }}
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="detail-layout">
            <div className="breadcrumb" onClick={() => setVista("lista")}>
              <span>General ∧</span> / <b>Mis mantenimientos ∧</b>
            </div>

            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 20 }}>
              {seleccionado?.title || nuevo.title || "Nuevo mantenimiento"}
            </div>

            <div className="detail-grid">
              <div className="field">
                <label>máquina:</label>
                <select
                  className="select"
                  value={form.machineId}
                  onChange={(e) =>
                    setForm({ ...form, machineId: e.target.value })
                  }
                >
                  <option value="">Seleccioná una máquina</option>
                  {maquinasVisibles.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>periodo:</label>
                <select
                  className="select"
                  value={form.periodo}
                  onChange={(e) =>
                    setForm({ ...form, periodo: e.target.value })
                  }
                >
                  {PERIODOS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>cada</label>
                {/* El campo solo manda cuando la periodicidad es
                    Personalizada. Con un preset el número es fijo: editable
                    pero ignorado, para no repetir el bug en el que "cada 1 día"
                    se guardaba como 90. */}
                <input
                  className="input"
                  type="number"
                  min="1"
                  readOnly={form.periodo !== "custom"}
                  value={
                    form.periodo === "custom"
                      ? form.dias
                      : (PERIODO_POR_VALUE[form.periodo]?.dias ?? "")
                  }
                  onChange={(e) => setForm({ ...form, dias: e.target.value })}
                />
                <span>días</span>
              </div>
              <div className="field">
                <label>fecha de alta:</label>
                <input
                  className="input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="tareas">
              <div className="section-title" style={{ marginBottom: 12 }}>
                TAREAS ({progresoForm}%)
              </div>
              {form.tareas.map((t, i) => (
                <div key={t._id ?? `nuevo-${i}`} className="task">
                  <input
                    type="checkbox"
                    checked={t.status === "done"}
                    disabled={tareaPendiente === t._id}
                    onChange={() => alternarTarea(i)}
                  />
                  <span
                    className="task-text"
                    style={{
                      textDecoration:
                        t.status === "done" ? "line-through" : "none",
                      color: t.status === "done" ? "#999" : "#111",
                    }}
                  >
                    {t.title}
                  </span>
                  <span className="task-status">
                    {TASK_STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
              ))}
              <div className="task-new">
                <input
                  placeholder="Añade una tarea + Enter"
                  value={form.nuevaTarea}
                  onChange={(e) =>
                    setForm({ ...form, nuevaTarea: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && agregarTarea()}
                />
                <button className="btn-black" onClick={agregarTarea}>
                  + Añadir
                </button>
              </div>
            </div>

            <div className="personal">
              <div className="section-title">PERSONAL ASIGNADO</div>
              <div className="avatars">
                {miembros
                  .filter((u) => form.asignados.includes(u._id))
                  .map((u) => (
                    <div key={u._id} className="avatar" title={u.name}>
                      {iniciales(u)}
                      <span
                        className="remove"
                        onClick={() => alternarAsignado(u._id)}
                      >
                        ✕
                      </span>
                    </div>
                  ))}
                <div
                  className="avatar add"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      mostrarAsignado: !f.mostrarAsignado,
                    }))
                  }
                >
                  +
                </div>
              </div>
              {form.mostrarAsignado && (
                <div className="personal-input">
                  {miembros.map((u) => (
                    <button
                      key={u._id}
                      className={`btn-ghost ${
                        form.asignados.includes(u._id) ? "active" : ""
                      }`}
                      onClick={() => alternarAsignado(u._id)}
                    >
                      {u.name} ({u.role})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="footer">
              <button className="btn-ghost" onClick={() => setVista("lista")}>
                Cancelar
              </button>
              {seleccionado && (
                <>
                  <button
                    className="btn-ghost"
                    disabled={guardando}
                    onClick={eliminar}
                  >
                    Eliminar
                  </button>
                  <button
                    className="btn-ghost"
                    disabled={guardando}
                    onClick={() =>
                      cambiarEstadoPlan(
                        seleccionado,
                        seleccionado.status === "inactive"
                          ? "active"
                          : "inactive",
                      )
                    }
                  >
                    {seleccionado.status === "inactive" ? "Reanudar" : "Pausar"}
                  </button>
                  <button
                    className="btn-ghost"
                    disabled={guardando}
                    onClick={marcarRealizado}
                  >
                    Marcar realizado
                  </button>
                </>
              )}
              <button
                className="btn-black"
                disabled={guardando || !form.machineId}
                onClick={guardar}
              >
                {guardando ? "Guardando…" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
