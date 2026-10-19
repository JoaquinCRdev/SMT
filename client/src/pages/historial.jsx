import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/layout/sidebar";
import i18n from "../i18n/i18n";
import api from "../api/axios";
import "../styles/pages/historial.css";

// El backend devuelve el estado como valor plano ("Realizado" | "Pendiente" |
// "Vencido"). Ese valor es data: viaja en los filtros y define las clases CSS
// (status-*, marker-*, accent-*). Para mostrar se traduce, para comparar y
// estilar se usa tal cual.
const ESTADOS = ["Realizado", "Pendiente", "Vencido"];

const LIMIT = 20;
const DEBOUNCE_MS = 300;

const RANGOS = ["7", "30", "90", "365", "todos"];

function normalizarEstado(estado) {
  return estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// El estado viene del backend en español; la clave para traducir es el slug.
function claveEstado(estado) {
  return normalizarEstado(estado);
}

function fechaLocal(fecha, opciones) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString(
    i18n.language || "es",
    opciones,
  );
}

// Adapta un item de /api/history a la forma que ya consume la UI. Sólo cambian
// de nombre los tres campos que la vista ya leía distinto: `machine.name`,
// `title` y `description`.
function adaptar(item) {
  return {
    ...item,
    nombre: item.machine?.name || "—",
    tipo: item.title || "",
    descripcion: item.description || "",
  };
}

// Única puerta de entrada al endpoint. Devuelve la respuesta ya adaptada y sin
// estado: quien la llama decide qué hacer con el resultado (el effect la
// reemplaza, el botón "Cargar más" la agrega al final).
async function fetchHistory(page, filtros) {
  const { data } = await api.get("/history", {
    params: {
      state: filtros.state,
      days: filtros.days,
      search: filtros.search.trim(),
      order: filtros.order,
      page,
      limit: LIMIT,
    },
  });

  return {
    items: (data.items || []).map(adaptar),
    counts: data.counts || { realizado: 0, pendiente: 0, vencido: 0 },
    machines: data.machines || [],
    meta: data.meta || { total: 0, page, pages: 0 },
  };
}

function StatCard({ number, text, status }) {
  return (
    <div className="stat-card">
      <div className="stat-number">{number}</div>
      <div className="stat-text">{text}</div>
      {status && (
        <div className="stat-status">
          <span className="status-dot" />
          {status}
        </div>
      )}
    </div>
  );
}

function ResumenMantenimientos({ counts }) {
  const items = [
    { key: "realizado", valor: counts.realizado },
    { key: "pendiente", valor: counts.pendiente },
    { key: "vencido", valor: counts.vencido },
  ];

  return (
    <div className="summary-row">
      {items.map(({ key, valor }) => (
        <div className="summary-item" key={key}>
          <span className={`summary-number summary-${key}`}>{valor}</span>
          <span className="summary-label">
            {i18n.t(`pages.historial.resumen.${key}`)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MaintenanceCard({ mantenimiento, onVerDetalles }) {
  const estadoSlug = normalizarEstado(mantenimiento.estado);
  const inicial = mantenimiento.nombre.trim().charAt(0).toUpperCase();

  return (
    <div className={`maintenance-card accent-${estadoSlug}`}>
      <div className={`maintenance-marker marker-${estadoSlug}`}>{inicial}</div>

      <div className="maintenance-info">
        <div className="maintenance-header">
          <strong>{mantenimiento.nombre}</strong>
          <span className="maintenance-type">{mantenimiento.tipo}</span>
        </div>
        <span className="maintenance-date">
          {fechaLocal(mantenimiento.fecha, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="maintenance-actions">
        <span className={`status-label status-${estadoSlug}`}>
          {i18n.t(`pages.historial.estados.${claveEstado(mantenimiento.estado)}`)}
        </span>
        <button
          className="maintenance-link"
          onClick={() => onVerDetalles(mantenimiento)}
        >
          {i18n.t("pages.historial.ver_detalle")}
        </button>
      </div>
    </div>
  );
}

export default function Historial() {
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [rangoFecha, setRangoFecha] = useState("30");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [orden, setOrden] = useState("recientes");

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
    realizado: 0,
    pendiente: 0,
    vencido: 0,
  });
  const [machines, setMachines] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 0 });

  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  // Evita que una respuesta vieja pise a una nueva (el usuario escribe rápido y
  // los pedidos pueden volver desordenados).
  const peticionActual = useRef(0);

  // Si cambia el idioma, las fechas deben reformatearse: re-render forzado.
  const [, setTickIdioma] = useState(0);
  useEffect(() => {
    const alCambiarIdioma = () => setTickIdioma((n) => n + 1);
    i18n.on("languageChanged", alCambiarIdioma);
    return () => i18n.off("languageChanged", alCambiarIdioma);
  }, []);

  // Debounce de la búsqueda: sin esto cada tecla dispara un pedido.
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [busqueda]);

  const filtros = useMemo(
    () => ({
      state: filtroEstado,
      days: rangoFecha,
      search: busquedaDebounced,
      order: orden,
    }),
    [filtroEstado, rangoFecha, busquedaDebounced, orden],
  );

  // Carga de la primera página: la dispara cualquier cambio de filtro. Va en
  // forma IIFE (y no llamando a `pedirPagina` directo) porque llamar a algo que
  // hace `setState` sincrónico dentro del cuerpo del effect dispara la cascada
  // de renders que el linter rechaza; acá el primer `setState` ocurre recién
  // después del `await`. Mismo patrón que SolicitudesSection/AuthContext.
  useEffect(() => {
    let cancelado = false;
    const id = ++peticionActual.current;

    (async () => {
      try {
        const data = await fetchHistory(1, filtros);
        if (cancelado || id !== peticionActual.current) return;

        setItems(data.items);
        setCounts(data.counts);
        setMachines(data.machines);
        setMeta(data.meta);
        setError("");
      } catch {
        if (cancelado || id !== peticionActual.current) return;
        setItems([]);
        setError(i18n.t("pages.historial.error"));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [filtros]);

  // Siguiente página: se agrega al final. La llama el botón, así que acá sí
  // vale el `setState` sincrónico (los handlers de eventos no están sujetos a
  // la regla de los effects).
  const pedirPagina = async (page) => {
    const id = ++peticionActual.current;
    setCargandoMas(true);

    try {
      const data = await fetchHistory(page, filtros);
      if (id !== peticionActual.current) return;

      setItems((prev) => [...prev, ...data.items]);
      setCounts(data.counts);
      setMachines(data.machines);
      setMeta(data.meta);
      setError("");
    } catch {
      if (id !== peticionActual.current) return;
      setError(i18n.t("pages.historial.error"));
    } finally {
      if (id === peticionActual.current) setCargandoMas(false);
    }
  };

  const hayMas = meta.page < meta.pages;

  // Las tarjetas de máquinas salen del listado completo del taller y se separan
  // por tipo: "maquina" para el equipamiento principal, "otro" para el resto.
  const maquinas = machines.filter((m) => m.tipo === "maquina");
  const otros = machines.filter((m) => m.tipo !== "maquina");
  const operativas = (lista) => lista.filter((m) => m.status === "active").length;

  const textoOperativos = (lista) =>
    i18n.t("pages.historial.maquinas.operativos", {
      operativos: operativas(lista),
      total: lista.length,
    });

  return (
    <div className="historial-layout">
      <Sidebar />

      <main className="historial-page">
        <div className="historial-container">
          {/* HEADER CON FILTRO DE FECHAS */}
          <div className="history-header">
            <span>{i18n.t("pages.historial.de")}</span>
            <select
              className="date-select"
              value={rangoFecha}
              onChange={(e) => setRangoFecha(e.target.value)}
            >
              {RANGOS.map((r) => (
                <option value={r} key={r}>
                  {i18n.t(`pages.historial.rangos.${r}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="stats-container">
            <StatCard
              number={maquinas.length}
              text={i18n.t("pages.historial.maquinas.registradas")}
              status={maquinas.length ? textoOperativos(maquinas) : ""}
            />
            <StatCard
              number={otros.length}
              text={i18n.t("pages.historial.otros.registrados")}
              status={otros.length ? textoOperativos(otros) : ""}
            />
          </div>

          <div className="section-title">
            {i18n.t("pages.historial.seccion")}
          </div>

          <ResumenMantenimientos counts={counts} />

          {/* BÚSQUEDA, FILTROS Y ORDENAMIENTO */}
          <div className="filters">
            <div className="search-group">
              <svg
                className="search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder={i18n.t("pages.historial.buscar")}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <span>{i18n.t("pages.historial.estado")}</span>
              <select
                className="custom-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">
                  {i18n.t("pages.historial.estados.todos")}
                </option>
                {ESTADOS.map((estado) => (
                  <option value={claveEstado(estado)} key={estado}>
                    {i18n.t(`pages.historial.estados.${claveEstado(estado)}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <span>{i18n.t("pages.historial.orden")}</span>
              <select
                className="custom-select"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="recientes">
                  {i18n.t("pages.historial.ordenes.recientes")}
                </option>
                <option value="antiguos">
                  {i18n.t("pages.historial.ordenes.antiguos")}
                </option>
              </select>
            </div>
          </div>

          {/* LISTA */}
          <div className="maintenance-list">
            {cargando ? (
              <p className="no-data">{i18n.t("pages.historial.cargando")}</p>
            ) : error ? (
              <p className="no-data">{error}</p>
            ) : items.length > 0 ? (
              items.map((mantenimiento) => (
                <MaintenanceCard
                  key={mantenimiento.id}
                  mantenimiento={mantenimiento}
                  onVerDetalles={setItemSeleccionado}
                />
              ))
            ) : (
              <p className="no-data">{i18n.t("pages.historial.sin_datos")}</p>
            )}
          </div>

          {hayMas && !cargando && (
            <div className="cargar-mas-container">
              <button
                className="cargar-mas"
                disabled={cargandoMas}
                onClick={() => pedirPagina(meta.page + 1)}
              >
                {i18n.t(
                  cargandoMas
                    ? "pages.historial.cargando"
                    : "pages.historial.cargar_mas",
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* OVERLAY Y PANEL LATERAL */}
      <div
        className={`drawer-overlay ${itemSeleccionado ? "active" : ""}`}
        onClick={() => setItemSeleccionado(null)}
      />

      <aside className={`drawer-panel ${itemSeleccionado ? "open" : ""}`}>
        {itemSeleccionado && (
          <div className="drawer-content">
            <div className="drawer-header">
              <h2>{i18n.t("pages.historial.drawer.titulo")}</h2>
              <button
                className="close-drawer"
                aria-label={i18n.t("pages.historial.drawer.cerrar")}
                onClick={() => setItemSeleccionado(null)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-section">
                <h3>{i18n.t("pages.historial.drawer.equipo")}</h3>
                <p>
                  {itemSeleccionado.nombre} ({itemSeleccionado.tipo})
                </p>
              </div>

              <div className="drawer-section">
                <h3>
                  {i18n.t(
                    itemSeleccionado.estado === "Realizado"
                      ? "pages.historial.drawer.fecha_realizacion"
                      : "pages.historial.drawer.fecha_programada",
                  )}
                </h3>
                <p className="drawer-date">
                  📅{" "}
                  {fechaLocal(itemSeleccionado.fecha, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="drawer-section">
                <h3>{i18n.t("pages.historial.drawer.estado_actual")}</h3>
                <span
                  className={`status-label status-${normalizarEstado(
                    itemSeleccionado.estado,
                  )}`}
                >
                  {itemSeleccionado.estado === "Realizado"
                    ? i18n.t("pages.historial.drawer.hecho")
                    : `⌛ ${i18n.t(
                        `pages.historial.estados.${claveEstado(
                          itemSeleccionado.estado,
                        )}`,
                      )}`}
                </span>
              </div>

              <div className="drawer-section">
                <h3>
                  {i18n.t(
                    itemSeleccionado.estado === "Realizado"
                      ? "pages.historial.drawer.que_se_hizo"
                      : "pages.historial.drawer.que_hacer",
                  )}
                </h3>
                <div className="drawer-description">
                  {itemSeleccionado.descripcion}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
