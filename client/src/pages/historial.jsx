import { useState, useMemo } from "react";
import Sidebar from "../components/layout/sidebar";
import "../styles/components/layout/auth/historial.css";

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

function StatCard({ number, text, status }) {
  return (
    <div className="stat-card">
      <div className="stat-title">
        <strong>{number}</strong>
        <span>{text}</span>
      </div>
      <div className="stat-content">
        <span className="operativos">{status}</span>
      </div>
    </div>
  );
}

function MaintenanceCard({ mantenimiento, onVerDetalles }) {
  const estadoSlug = mantenimiento.estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const estadoClass = `status-badge status-${estadoSlug}`;
  const buttonClass = `maintenance-button button-${estadoSlug}`;

  const fechaFormateada = new Date(mantenimiento.fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="maintenance-card">
      <div className="maintenance-image">
        <div className="diagonal diagonal-one"></div>
        <div className="diagonal diagonal-two"></div>
      </div>

      <div className="maintenance-info">
        <div className="maintenance-header">
          <strong>{mantenimiento.nombre}</strong>
          <span>{fechaFormateada}</span>
        </div>
        <span className="maintenance-type">{mantenimiento.tipo}</span>
      </div>

      <div className="maintenance-actions">
        <span className={estadoClass}>
          {mantenimiento.estado} - {mantenimiento.tipo}
        </span>
        <button className={buttonClass} onClick={() => onVerDetalles(mantenimiento)}>
          Ver mantenimiento
        </button>
      </div>
    </div>
  );
}

export default function Historial() {
  const [rangoFecha, setRangoFecha] = useState("30");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [orden, setOrden] = useState("recientes");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  // Lógica combinada de Filtrado y Ordenamiento
  const mantenimientosProcesados = useMemo(() => {
    return mantenimientosIniciales
      .filter((item) => {
        if (rangoFecha === "todos") return true;
        const fechaItem = new Date(item.fecha);
        const hoy = new Date();
        const diferenciaDias = (hoy - fechaItem) / (1000 * 60 * 60 * 24);
        return diferenciaDias <= parseInt(rangoFecha, 10);
      })
      .filter((item) => {
        if (filtroEstado === "Todos") return true;
        return item.estado.toLowerCase() === filtroEstado.toLowerCase();
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return orden === "recientes" ? fechaB - fechaA : fechaA - fechaB;
      });
  }, [rangoFecha, filtroEstado, orden]);

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
            <StatCard number="5" text=" máquinas registradas" status="4/5 operativos" />
            <StatCard number="11" text=" otros registrados" status="6/11 operativos" />
          </div>

          <div className="section-title">Mantenimientos</div>

          <div className="maintenance-summary">
            <div className="summary-card summary-success"><span>Realizados:</span><strong>32</strong></div>
            <div className="summary-card summary-warning"><span>Pendientes:</span><strong>10</strong></div>
            <div className="summary-card summary-info"><span>Próximos:</span><strong>5</strong></div>
            <div className="summary-card summary-danger"><span>Vencidos:</span><strong>1</strong></div>
          </div>

          {/* FILTROS Y ORDENAMIENTO */}
          <div className="filters">
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
              <h2>Detalle del Mantenimiento</h2>
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
                  📅 {new Date(itemSeleccionado.fecha).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="drawer-section">
                <h3>Estado actual</h3>
                <span className={`status-badge status-${itemSeleccionado.estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
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