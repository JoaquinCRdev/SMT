import { useState, useMemo } from "react";
import Sidebar from "../components/layout/sidebar";
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
  const [busqueda, setBusqueda] = useState("");
  const [rangoFecha, setRangoFecha] = useState("30");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [orden, setOrden] = useState("recientes");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  // Lógica combinada de Filtrado y Ordenamiento
  const mantenimientosProcesados = useMemo(() => {
    const terminoBusqueda = busqueda.toLowerCase().trim();

    return mantenimientosIniciales
      .filter((item) => {
        if (!terminoBusqueda) return true;
        return (
          item.nombre.toLowerCase().includes(terminoBusqueda) ||
          item.descripcion.toLowerCase().includes(terminoBusqueda)
        );
      })
      .filter((item) => {
        if (rangoFecha === "todos") return true;
        const fechaItem = new Date(`${item.fecha}T00:00:00`);
        const hoy = new Date();
        const diferenciaDias = (hoy - fechaItem) / (1000 * 60 * 60 * 24);
        return diferenciaDias <= parseInt(rangoFecha, 10);
      })
      .filter((item) => {
        if (filtroEstado === "Todos") return true;
        return item.estado.toLowerCase() === filtroEstado.toLowerCase();
      })
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T00:00:00`).getTime();
        const fechaB = new Date(`${b.fecha}T00:00:00`).getTime();
        return orden === "recientes" ? fechaB - fechaA : fechaA - fechaB;
      });
  }, [busqueda, rangoFecha, filtroEstado, orden]);

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

          <div className="stats-container">
            <StatCard number="5" text="máquinas registradas" status="4/5 operativos" />
            <StatCard number="11" text="otros registrados" status="6/11 operativos" />
          </div>

          <div className="section-title">Mantenimientos</div>

          <ResumenMantenimientos realizados={32} pendientes={10} proximos={5} vencidos={1} />

          {/* BÚSQUEDA, FILTROS Y ORDENAMIENTO */}
          <div className="filters">
            <div className="search-group">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar equipo o descripción..."
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

          {/* LISTA */}
          <div className="maintenance-list">
            {mantenimientosProcesados.length > 0 ? (
              mantenimientosProcesados.map((mantenimiento) => (
                <MaintenanceCard
                  key={mantenimiento.id}
                  mantenimiento={mantenimiento}
                  onVerDetalles={setItemSeleccionado}
                />
              ))
            ) : (
              <p className="no-data">No hay mantenimientos en este rango de selección.</p>
            )}
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
                <p>{itemSeleccionado.nombre} ({itemSeleccionado.tipo})</p>
              </div>

              <div className="drawer-section">
                <h3>{itemSeleccionado.estado === "Realizado" ? "Fecha de realización" : "Fecha programada"}</h3>
                <p className="drawer-date">
                  📅 {new Date(`${itemSeleccionado.fecha}T00:00:00`).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="drawer-section">
                <h3>Estado actual</h3>
                <span className={`status-label status-${normalizarEstado(itemSeleccionado.estado)}`}>
                  {itemSeleccionado.estado === "Realizado" ? "✔ Hecho" : "⌛ " + itemSeleccionado.estado}
                </span>
              </div>

              <div className="drawer-section">
                <h3>{itemSeleccionado.estado === "Realizado" ? "¿Qué se hizo?" : "¿Qué se tiene que hacer?"}</h3>
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