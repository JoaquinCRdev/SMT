import { useState } from "react";
import  "../styles/pages/mantenimiento.css"
import Sidebar from "../components/layout/sidebar";

const TAREAS_INICIALES = [
  { id: 1, text: "Drenar acumulación de agua", done: false },
  { id: 2, text: "Medir el desgaste de discos", done: false },
  { id: 3, text: "Limpiar el tanque de taladrina", done: true },
];

const PROGRAMADOS = [
  { id: 1, maquina: "Pinacho Mustang 225", tipo: "Mantenimiento Trimestral" },
  { id: 2, maquina: "Pinacho Mustang 225", tipo: "Mantenimiento Anual" },
  { id: 3, maquina: "Torno CNC HAAS", tipo: "Mantenimiento Mensual" },
];

const ACTIVOS = [
  { id: 1, maquina: "Pinacho Mustang 225", tipo: "Mantenimiento Trimestral", pct: 63, vencido: true, dias: 3 },
  { id: 2, maquina: "Fresadora Bridgeport", tipo: "Mantenimiento Semanal", pct: 25, vencido: false },
  { id: 3, maquina: "Pinacho Mustang 225", tipo: "Lubricación", pct: 91, vencido: false },
];

export default function MantenimientoApp() {
  const [vista, setVista] = useState("lista"); // lista | detalle
  const [periodo, setPeriodo] = useState("Trimestral");
  const [tareas, setTareas] = useState(TAREAS_INICIALES);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [asignados, setAsignados] = useState(["JD", "ML", "AR", "CP"]);

  const addTarea = () => {
    if (!nuevaTarea.trim()) return;
    setTareas([...tareas, { id: Date.now(), text: nuevaTarea, done: false }]);
    setNuevaTarea("");
  };

  return (
      <div className="contenedor-principal">
        
      <Sidebar/>
    <div className="app">
      <div className="header">
        <div className="tabs">
          <button className="tab active">Máquinas</button>
          <button className="tab">Otros</button>
        </div>
        <div className="filter">
          <span className="chip dd" onClick={() => vista === "detalle" && setVista("lista")}>
            {vista === "lista" ? "General ∨" : "General ∧ / Mis mantenimientos ∧ / General ∧"}
          </span>
        </div>
      </div>

      {vista === "lista" ? (
        <>
          <div className="section">
            <div className="section-head">
              <div>
                <div className="section-title">Programados</div>
                <div className="section-sub">5 mantenimientos</div>
              </div>
              <button className="btn-ghost">General ∨</button>
            </div>
            <div className="grid">
              {PROGRAMADOS.map((m) => (
                <div key={m.id} className="card">
                  <div className="card-top"><span className="badge">{m.maquina}</span></div>
                  <div className="card-title">{m.tipo}</div>
                  <div className="card-desc">Mantenimiento preventivo planificado</div>
                  <button className="btn-detail" onClick={() => setVista("detalle")}>Ver detalle</button>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <button className="btn-black">+ Agregar mantenimiento</button>
            </div>
            <div className="section-head">
              <div><div className="section-title">Activos</div></div>
            </div>
            <div className="grid">
              {ACTIVOS.map((m) => (
                <div key={m.id} className="card active">
                  <div className="card-top"><span className="badge">{m.maquina}</span></div>
                  <div className="card-title">{m.tipo}</div>
                  <div className="progress-wrap">
                    {m.vencido && <div className="alert">⚠ Venció hace {m.dias}d</div>}
                    <div className="progress-meta"><span>{m.pct}%</span><span>avance</span></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${m.pct}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="detail-layout">
          <div className="breadcrumb" onClick={() => setVista("lista")}>
            <span>General ∧</span> / <b>Mis mantenimientos ∧</b> / <b>General ∧</b>
          </div>

          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 20 }}>Mantenimiento Trimestral</div>

          <div className="detail-grid">
            <div className="field">
              <label>máquina:</label>
              <span className="pill">Pinacho Mustang 225</span>
            </div>
            <div className="field">
              <label>periodo:</label>
              <select className="select" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                <option>Trimestral</option>
                <option>Mensual</option>
                <option>Semestral</option>
                <option>Anual</option>
              </select>
            </div>
            <div className="field">
              <label>fecha de alta:</label>
              <span className="pill">cada 29</span>
            </div>
            <div className="field">
              <label>meses:</label>
              <div className="pill-group">
                <span className="pill">Enero</span><span className="pill">Abril</span><span className="pill">Julio</span><span className="pill">Octubre</span>
              </div>
              {periodo === "Trimestral" && <div className="note">que aparezca solo al seleccionar "trimestral"</div>}
            </div>
            <div className="field">
              <label>tiempo de realización:</label>
              <span className="pill">1 Semana</span>
            </div>
          </div>

          <div className="tareas">
            <div className="section-title" style={{ marginBottom: 12 }}>TAREAS</div>
            {tareas.map((t) => (
              <div key={t.id} className="task">
                <input type="checkbox" checked={t.done} onChange={() => setTareas(tareas.map(x => x.id===t.id ? {...x, done:!x.done} : x))} />
                <span style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "#999" : "#111" }}>{t.text}</span>
              </div>
            ))}
            <div className="task-new">
              <input placeholder="Añade una tarea" value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && addTarea()} />
              <button className="btn-black" onClick={addTarea}>+ Añadir</button>
            </div>
          </div>

          <div className="personal">
            <div className="section-title">PERSONAL ASIGNADO</div>
            <div className="avatars">
              {asignados.map((a, i) => <div key={i} className="avatar">{a}</div>)}
              <div className="avatar add" onClick={() => setAsignados([...asignados, "N" + (asignados.length+1)])}>+</div>
            </div>
          </div>

          <div className="footer">
            <button className="btn-ghost" onClick={() => setVista("lista")}>Cancelar</button>
            <button className="btn-black" onClick={() => setVista("lista")}>Guardar Cambios</button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
