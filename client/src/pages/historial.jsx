import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/sidebar";
import api from "../api/axios";
import "../styles/pages/historial.css";

// Muestra de datos con formato de fecha YYYY-MM-DD
const mantenimientosIniciales = [
  {
    id: 1,
    nombre: "Compresor A",
    fecha: "2026-03-15",
    tipo: "Preventivo",
    estado: "Realizado",
    descripcion: "Se realizó cambio de aceite, sustitución de filtros de aire y revisión de presiones.",
  },
  {
    id: 2,
    nombre: "Torno CNC",
    fecha: "2026-03-20",
    tipo: "Correctivo",
    estado: "Pendiente",
    descripcion: "Se requiere calibración del eje Z y reemplazo de banda de transmisión gastada.",
  },
  {
    id: 3,
    nombre: "Generador B",
    fecha: "2026-02-10",
    tipo: "Predictivo",
    estado: "Vencido",
    descripcion: "Análisis de vibración programado no ejecutado a tiempo. Urge inspección.",
  },
  {
    id: 4,
    nombre: "Bomba de Agua",
    fecha: "2026-03-28",
    tipo: "Preventivo",
    estado: "Proximo",
    descripcion: "Mantenimiento rutinario de lubrificación de rodamientos y verificación de sellos.",
  },
];

function normalizarEstado(estado) {
  return estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function StatCard({ number, text, status }) {
  return (
    <div className="stat-card">
      <div className="stat-number">{number}</div>
      <div className="stat-text">{text}</div>
      <div className="stat-status">
        <span className="status-dot" />
        {status}
      </div>
    </div>
  );
}

function ResumenMantenimientos({ realizados, pendientes, proximos, vencidos }) {
  return (
    <div className="summary-row">
      <div className="summary-item">
        <span className="summary-number summary-realizado">{realizados}</span>
        <span className="summary-label">Realizados</span>
      </div>
      <div className="summary-item">
        <span className="summary-number summary-pendiente">{pendientes}</span>
        <span className="summary-label">Pendientes</span>
      </div>
      <div className="summary-item">
        <span className="summary-number summary-proximo">{proximos}</span>
        <span className="summary-label">Próximos</span>
      </div>
      <div className="summary-item">
        <span className="summary-number summary-vencido">{vencidos}</span>
        <span className="summary-label">Vencidos</span>
      </div>
    </div>
  );
}

function MaintenanceCard({ mantenimiento, onVerDetalles }) {
  const estadoSlug = normalizarEstado(mantenimiento.estado);
  const inicial = mantenimiento.nombre.trim().charAt(0).toUpperCase();

  const fechaFormateada = new Date(`${mantenimiento.fecha}T00:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className={`maintenance-card accent-${estadoSlug}`}>
      <div className={`maintenance-marker marker-${estadoSlug}`}>{inicial}</div>

      <div className="maintenance-info">
        <div className="maintenance-header">
          <strong>{mantenimiento.nombre}</strong>
          <span className="maintenance-type">{mantenimiento.tipo}</span>
        </div>
        <span className="maintenance-date">{fechaFormateada}</span>
      </div>

      <div className="maintenance-actions">
        <span className={`status-label status-${estadoSlug}`}>{mantenimiento.estado}</span>
        <button className="maintenance-link" onClick={() => onVerDetalles(mantenimiento)}>
          Ver detalle
        </button>
      </div>
    </div>
  );
}

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // Referencia temporal fija: leer Date.now() durante el render no es puro.
  const [ahora, setAhora] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [rangoFecha, setRangoFecha] = useState("todos");
  const [orden, setOrden] = useState("recientes");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const [registrosRes, maquinasRes] = await Promise.all([
          api.get("/records", { params: { limit: 200 } }),
          api.get("/machine", { params: { limit: 200 } }),
        ]);
        if (cancelado) return;

        setAhora(Date.now());
        setRegistros(
          (registrosRes.data.items ?? []).map((item) => ({
            id: item._id,
            titulo: item.title,
            descripcion: item.description || "",
            fecha: item.performedAt,
            maquina: item.machineId || null,
            plan: item.planId || null,
            tecnico: item.technician || "",
            duracion: item.duration,
            costo: item.cost,
            repuestos: item.partsUsed || "",
            resultados: item.results || "",
            notas: item.notes || "",
          })),
        );
        setMaquinas(maquinasRes.data.items ?? []);
      } catch (err) {
        if (cancelado) return;
        setError(
          err.response?.data?.message || "No se pudo cargar el historial",
        );
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const resumen = useMemo(() => {
    const porTipo = (tipo) => maquinas.filter((m) => m.tipo === tipo);
    const operativos = (lista) =>
      lista.filter((m) => m.status === "active").length;

    const costoTotal = registros.reduce(
      (total, r) => total + (r.costo ?? 0),
      0,
    );
    const conDuracion = registros.filter((r) => r.duracion != null);
    const duracionPromedio = conDuracion.length
      ? conDuracion.reduce((t, r) => t + r.duracion, 0) / conDuracion.length
      : 0;

    const inicioMes = new Date(ahora);
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const esteMes = registros.filter(
      (r) => new Date(r.fecha) >= inicioMes,
    ).length;

    return {
      maquinas: porTipo("maquina"),
      otros: porTipo("otro"),
      operativosMaquinas: operativos(porTipo("maquina")),
      operativosOtros: operativos(porTipo("otro")),
      costoTotal,
      duracionPromedio,
      esteMes,
    };
  }, [registros, maquinas, ahora]);

  const mantenimientosProcesados = useMemo(() => {
    const terminoBusqueda = busqueda.toLowerCase().trim();

    return registros
      .filter((item) => {
        if (!terminoBusqueda) return true;
        return (
          item.titulo.toLowerCase().includes(terminoBusqueda) ||
          item.descripcion.toLowerCase().includes(terminoBusqueda) ||
          (item.maquina?.nombre || "")
            .toLowerCase()
            .includes(terminoBusqueda)
        );
      })
      .filter((item) => {
        if (rangoFecha === "todos") return true;
        const dias = (ahora - new Date(item.fecha).getTime()) / 86400000;
        return dias <= parseInt(rangoFecha, 10);
      })
      .sort((a, b) =>
        orden === "recientes"
          ? new Date(b.fecha) - new Date(a.fecha)
          : new Date(a.fecha) - new Date(b.fecha),
      );
  }, [registros, busqueda, rangoFecha, orden, ahora]);

  return (
    <div className="historial-layout">
      <Sidebar />

      <main className="historial-page">
        <div className="historial-container">

          {/* HEADER CON FILTRO DE FECHAS */}
          <div className="history-header">
            <span>Historial de:</span>
            <select
              className="date-select"
              value={rangoFecha}
              onChange={(e) => setRangoFecha(e.target.value)}
            >
              <option value="7">Últ. 7 días</option>
              <option value="30">Últ. 30 días</option>
              <option value="90">Últ. 90 días</option>
              <option value="365">Último año</option>
              <option value="todos">Todo el historial</option>
            </select>
          </div>

          {error && <p className="historial-error">{error}</p>}

          <div className="stats-container">
            <StatCard number="5" text="máquinas registradas" status="4/5 operativos" />
            <StatCard number="11" text="otros registrados" status="6/11 operativos" />
          </div>

          <div className="section-title">Mantenimientos</div>

          <ResumenMantenimientos realizados={32} pendientes={10} proximos={5} vencidos={1} />

          <div className="filters">
            <div className="search-group">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar equipo, título o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <span>Estado:</span>
              <select
                className="custom-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Realizado">Realizados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Proximo">Próximos</option>
                <option value="Vencido">Vencidos</option>
              </select>
            </div>

            <div className="filter-group">
              <span>Ordenar por:</span>
              <select
                className="custom-select"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="recientes">Más Recientes</option>
                <option value="antiguos">Más Antiguos</option>
              </select>
            </div>
          </div>

          <div className="maintenance-list">
            {cargando && <p className="no-data">Cargando historial...</p>}

            {!cargando && error && (
              <p className="no-data">No se pudo cargar el historial.</p>
            )}

            {!cargando && !error && mantenimientosProcesados.length === 0 && (
              <p className="no-data">
                No hay mantenimientos en este rango de selección.
              </p>
            )}

            {!cargando &&
              !error &&
              mantenimientosProcesados.map((mantenimiento) => (
                <MaintenanceCard
                  key={mantenimiento.id}
                  mantenimiento={mantenimiento}
                  onVerDetalles={setItemSeleccionado}
                />
              ))}
          </div>
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
              <h2>Detalle del mantenimiento</h2>
              <button className="close-drawer" onClick={() => setItemSeleccionado(null)}>✕</button>
            </div>

            <div className="drawer-body">
              <div className="drawer-section">
                <h3>Equipo</h3>
                <p>
                  {itemSeleccionado.maquina?.nombre || "Equipo eliminado"}
                  {itemSeleccionado.maquina?.serialNumber
                    ? ` (S/N ${itemSeleccionado.maquina.serialNumber})`
                    : ""}
                </p>
              </div>

              <div className="drawer-section">
                <h3>Fecha de realización</h3>
                <p className="drawer-date">
                  📅 {fechaLarga(itemSeleccionado.fecha)}
                </p>
              </div>

              <div className="drawer-section">
                <h3>Estado actual</h3>
                <span className={`status-label status-${normalizarEstado(itemSeleccionado.estado)}`}>
                  {itemSeleccionado.estado === "Realizado" ? "✔ Hecho" : "⌛ " + itemSeleccionado.estado}
                </span>
              </div>

              {itemSeleccionado.plan && (
                <div className="drawer-section">
                  <h3>Plan</h3>
                  <p>{itemSeleccionado.plan.title}</p>
                </div>
              )}

              {itemSeleccionado.tecnico && (
                <div className="drawer-section">
                  <h3>Técnico</h3>
                  <p>{itemSeleccionado.tecnico}</p>
                </div>
              )}

              {itemSeleccionado.duracion != null && (
                <div className="drawer-section">
                  <h3>Duración</h3>
                  <p>{itemSeleccionado.duracion} h</p>
                </div>
              )}

              {itemSeleccionado.costo != null && (
                <div className="drawer-section">
                  <h3>Costo</h3>
                  <p>{numero(itemSeleccionado.costo)}</p>
                </div>
              )}

              {itemSeleccionado.repuestos && (
                <div className="drawer-section">
                  <h3>Repuestos</h3>
                  <p>{itemSeleccionado.repuestos}</p>
                </div>
              )}

              {itemSeleccionado.resultados && (
                <div className="drawer-section">
                  <h3>¿Qué se hizo?</h3>
                  <div className="drawer-description">
                    {itemSeleccionado.resultados}
                  </div>
                </div>
              )}

              {itemSeleccionado.descripcion && (
                <div className="drawer-section">
                  <h3>Descripción</h3>
                  <div className="drawer-description">
                    {itemSeleccionado.descripcion}
                  </div>
                </div>
              )}

              {itemSeleccionado.notas && (
                <div className="drawer-section">
                  <h3>Notas</h3>
                  <div className="drawer-description">
                    {itemSeleccionado.notas}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
