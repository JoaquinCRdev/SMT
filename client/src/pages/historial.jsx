import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/sidebar";
import api from "../api/axios";
import "../styles/pages/historial.css";

const numero = (valor) => new Intl.NumberFormat("es-AR").format(valor ?? 0);

const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fechaLarga = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
  // Un registro es por definición un mantenimiento ya realizado: el estado no
  // viene del backend, así que se usa la variante "realizado" del badge.
  const maquina = mantenimiento.maquina;

  return (
    <div className="maintenance-card">
      <div className="maintenance-image">
        <div className="diagonal diagonal-one"></div>
        <div className="diagonal diagonal-two"></div>
      </div>

      <div className="maintenance-info">
        <div className="maintenance-header">
          <strong>{mantenimiento.titulo}</strong>
          <span>{fechaCorta(mantenimiento.fecha)}</span>
        </div>
        <span className="maintenance-type">
          {maquina?.nombre || "Equipo eliminado"}
        </span>
      </div>

      <div className="maintenance-actions">
        <span className="status-badge status-realizado">
          Realizado - {maquina?.marca || "sin marca"}
        </span>
        <button
          className="maintenance-button button-realizado"
          onClick={() => onVerDetalles(mantenimiento)}
        >
          Ver mantenimiento
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
            <StatCard
              number={numero(resumen.maquinas.length)}
              text=" máquinas registradas"
              status={`${resumen.operativosMaquinas}/${resumen.maquinas.length} operativos`}
            />
            <StatCard
              number={numero(resumen.otros.length)}
              text=" otros registrados"
              status={`${resumen.operativosOtros}/${resumen.otros.length} operativos`}
            />
          </div>

          <div className="section-title">Mantenimientos</div>

          <div className="maintenance-summary">
            <div className="summary-card summary-success">
              <span>Registrados:</span>
              <strong>{numero(registros.length)}</strong>
            </div>
            <div className="summary-card summary-info">
              <span>Este mes:</span>
              <strong>{numero(resumen.esteMes)}</strong>
            </div>
            <div className="summary-card summary-warning">
              <span>Costo total:</span>
              <strong>{numero(Math.round(resumen.costoTotal))}</strong>
            </div>
            <div className="summary-card summary-danger">
              <span>Duración prom. (h):</span>
              <strong>
                {resumen.duracionPromedio
                  ? numero(Number(resumen.duracionPromedio.toFixed(1)))
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="filters">
            <div className="search-group">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar equipo, título o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
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

      <div
        className={`drawer-overlay ${itemSeleccionado ? "active" : ""}`}
        onClick={() => setItemSeleccionado(null)}
      />

      <aside className={`drawer-panel ${itemSeleccionado ? "open" : ""}`}>
        {itemSeleccionado && (
          <div className="drawer-content">
            <div className="drawer-header">
              <h2>Detalle del Mantenimiento</h2>
              <button
                className="close-drawer"
                onClick={() => setItemSeleccionado(null)}
              >
                ✕
              </button>
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
                <span className="status-badge status-realizado">
                  ✔ Hecho
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
