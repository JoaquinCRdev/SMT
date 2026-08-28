import Sidebar from "../components/layout/sidebar";
import "../styles/components/layout/auth/historial.css";

const mantenimientos = [
  {
    nombre: "Nombre",
    fecha: "Fecha",
    tipo: "Tipo",
    estado: "Realizado",
  },
  {
    nombre: "Nombre",
    fecha: "Fecha",
    tipo: "Tipo",
    estado: "Realizado",
  },
  {
    nombre: "Nombre",
    fecha: "Fecha",
    tipo: "Tipo",
    estado: "Realizado",
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

function MaintenanceCard({ mantenimiento }) {
  return (
    <div className="maintenance-card">
      <div className="maintenance-image">
        <div className="diagonal diagonal-one"></div>
        <div className="diagonal diagonal-two"></div>
      </div>

      <div className="maintenance-info">
        <div className="maintenance-header">
          <strong>{mantenimiento.nombre}</strong>
          <span>{mantenimiento.fecha}</span>
        </div>

        <span className="maintenance-type">
          {mantenimiento.tipo}
        </span>
      </div>

      <div className="maintenance-actions">
        <span className="status-badge">
          {mantenimiento.estado}
        </span>

        <button className="maintenance-button">
          Ver mantenimiento
        </button>
      </div>
    </div>
  );
}

export default function Historial() {
  return (
    <div className="historial-layout">

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO DEL HISTORIAL */}
      <main className="historial-page">

        <div className="historial-container">

          <div className="history-header">
            <span>Historial de:</span>

            <div className="date-select">
              <span>Ult. 30 dias</span>
              <span className="select-arrow">⌄</span>
            </div>
          </div>

          <div className="stats-container">

            <StatCard
              number="5"
              text=" maquinas registradas"
              status="4/5 operativos"
            />

            <StatCard
              number="11"
              text="   otros registrados"
              status="6/11 operativos"
            />

          </div>

          <div className="section-title">
            Mantenimientos
          </div>

          <div className="maintenance-summary">

            <div className="summary-card summary-success">
              <span>Realizados:</span>
              <strong>32</strong>
            </div>

            <div className="summary-card summary-warning">
              <span>Pendientes:</span>
              <strong>10</strong>
            </div>

            <div className="summary-card summary-info">
              <span>Proximos:</span>
              <strong>5</strong>
            </div>

            <div className="summary-card summary-danger">
              <span>Vencidos:</span>
              <strong>1</strong>
            </div>

          </div>

          <div className="filters">

            <div className="filter-group">
              <span>Estado:</span>

              <div className="custom-select">
                Todos
                <span className="select-arrow">⌄</span>
              </div>
            </div>

            <div className="filter-group">
              <span>Ordenar por:</span>

              <div className="custom-select">
                Mas Recientes
                <span className="select-arrow">⌄</span>
              </div>
            </div>

          </div>

          <div className="maintenance-list">

            {mantenimientos.map((mantenimiento, index) => (
              <MaintenanceCard
                key={index}
                mantenimiento={mantenimiento}
              />
            ))}

          </div>

        </div>

      </main>

    </div>
  );
}