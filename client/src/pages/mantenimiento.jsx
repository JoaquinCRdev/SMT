import { useState } from "react";
import "../styles/pages/mantenimiento.css";
import Sidebar from "../components/layout/sidebar";

const TAREAS_BASE = [
  { id: 1, text: "Drenar acumulación de agua", done: false },
  { id: 2, text: "Medir el desgaste de discos", done: false },
  { id: 3, text: "Limpiar el tanque de taladrina", done: true },
];

const MESES_ALL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function MantenimientoApp() {
  // Navegación y filtros
  const [vista, setVista] = useState("lista");
  const [tabActivo, setTabActivo] = useState("Maquinas");
  const [filtroGeneral, setFiltroGeneral] = useState("General");
  const [showFiltro, setShowFiltro] = useState(false);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);

  // Datos
  const [programados, setProgramados] = useState([
    { id: 1, maquina: "Pinacho Mustang 225", tipo: "Mantenimiento Trimestral", categoria: "Maquinas" },
    { id: 2, maquina: "Pinacho Mustang 225", tipo: "Mantenimiento Anual", categoria: "Maquinas" },
    { id: 3, maquina: "Torno CNC HAAS", tipo: "Mantenimiento Mensual", categoria: "Maquinas" },
    { id: 4, maquina: "Compresor Atlas", tipo: "Cambio de filtros", categoria: "Otros" },
  ]);
  const [activos, setActivos] = useState([
    { id: 1, maquina: "Pinacho Mustang 225", tipo: "Mantenimiento Trimestral", pct: 63, vencido: true, dias: 3 },
    { id: 2, maquina: "Fresadora Bridgeport", tipo: "Mantenimiento Semanal", pct: 25, vencido: false },
    { id: 3, maquina: "Pinacho Mustang 225", tipo: "Lubricación", pct: 91, vencido: false },
  ]);

  // Form detalle
  const [periodo, setPeriodo] = useState("Trimestral");
  const [maquina, setMaquina] = useState("Pinacho Mustang 225");
  const [fechaAlta, setFechaAlta] = useState("29");
  const [tiempo, setTiempo] = useState("1 Semana");
  const [mesesSel, setMesesSel] = useState(["Enero","Abril","Julio","Octubre"]);
  const [tareas, setTareas] = useState(TAREAS_BASE);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [asignados, setAsignados] = useState(["JD","ML","AR","CP"]);
  const [nuevoAsignado, setNuevoAsignado] = useState("");
  const [showAddAsignado, setShowAddAsignado] = useState(false);

  // Modal agregar
  const [showModal, setShowModal] = useState(false);
  const [nuevoMant, setNuevoMant] = useState({ maquina: "Pinacho Mustang 225", tipo: "" });

  const filtrados = programados.filter(p => {
    if (tabActivo === "Otros" && p.categoria !== "Otros") return false;
    if (tabActivo === "Maquinas" && p.categoria === "Otros") return false;
    if (filtroGeneral !== "General" && !p.tipo.includes(filtroGeneral)) return false;
    return true;
  });

  const handleVerDetalle = (m) => {
    setMantenimientoSeleccionado(m);
    setMaquina(m.maquina);
    setVista("detalle");
  };

  const handleAddTarea = () => {
    if (!nuevaTarea.trim()) return;
    setTareas([...tareas, { id: Date.now(), text: nuevaTarea, done: false }]);
    setNuevaTarea("");
  };

  const handleGuardar = () => {
    // Aquí iría tu API
    console.log("Guardado", { maquina, periodo, fechaAlta, tiempo, mesesSel, tareas, asignados });
    setVista("lista");
  };

  const handleCrearMantenimiento = () => {
    if (!nuevoMant.tipo.trim()) return;
    const nuevo = { id: Date.now(), maquina: nuevoMant.maquina, tipo: nuevoMant.tipo, categoria: tabActivo };
    setProgramados([...programados, nuevo]);
    setShowModal(false);
    setNuevoMant({ maquina: "Pinacho Mustang 225", tipo: "" });
  };

  const toggleMes = (mes) => {
    setMesesSel(prev => prev.includes(mes) ? prev.filter(m=>m!==mes) : [...prev, mes]);
  };

  return (
    <div className="contenedor-principal">
      <Sidebar/>
      <div className="app">
        <div className="header">
          <div className="tabs">
            <button className={`tab ${tabActivo==="Maquinas" ? "active" : ""}`} onClick={()=>setTabActivo("Maquinas")}>Máquinas</button>
            <button className={`tab ${tabActivo==="Otros" ? "active" : ""}`} onClick={()=>setTabActivo("Otros")}>Otros</button>
          </div>
          <div className="filter">
            <div className="dropdown">
              <span className="chip dd" onClick={() => setShowFiltro(!showFiltro)}>
                {filtroGeneral} ∨
              </span>
              {showFiltro && (
                <div className="dropdown-menu">
                  {["General","Trimestral","Mensual","Anual","Semanal"].map(op=>(
                    <div key={op} className={`dropdown-item ${filtroGeneral===op?"active":""}`} onClick={()=>{setFiltroGeneral(op); setShowFiltro(false)}}>{op}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {vista === "lista" ? (
          <>
            <div className="section">
              <div className="section-head">
                <div>
                  <div className="section-title">Programados</div>
                  <div className="section-sub">{filtrados.length} mantenimientos</div>
                </div>
              </div>
              <div className="grid">
                {filtrados.map((m) => (
                  <div key={m.id} className="card">
                    <div className="card-top"><span className="badge">{m.maquina}</span></div>
                    <div className="card-title">{m.tipo}</div>
                    <div className="card-desc">Mantenimiento preventivo planificado</div>
                    <button className="btn-detail" onClick={() => handleVerDetalle(m)}>Ver detalle</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <div className="section-head">
                <button className="btn-black" onClick={()=>setShowModal(true)}>+ Agregar mantenimiento</button>
              </div>
              <div className="section-head">
                <div><div className="section-title">Activos</div></div>
              </div>
              <div className="grid">
                {activos.map((m) => (
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

            {showModal && (
              <div className="modal-overlay" onClick={()=>setShowModal(false)}>
                <div className="modal" onClick={e=>e.stopPropagation()}>
                  <h3>Nuevo mantenimiento</h3>
                  <div className="modal-grid">
                    <div className="field">
                      <label>máquina</label>
                      <input className="input" value={nuevoMant.maquina} onChange={e=>setNuevoMant({...nuevoMant, maquina: e.target.value})} placeholder="Ej: Pinacho Mustang 225" />
                    </div>
                    <div className="field">
                      <label>tipo</label>
                      <input className="input" value={nuevoMant.tipo} onChange={e=>setNuevoMant({...nuevoMant, tipo: e.target.value})} placeholder="Ej: Mantenimiento Trimestral" autoFocus />
                    </div>
                    <div className="footer" style={{marginTop:0}}>
                      <button className="btn-ghost" onClick={()=>setShowModal(false)}>Cancelar</button>
                      <button className="btn-black" onClick={handleCrearMantenimiento}>Crear</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="detail-layout">
            <div className="breadcrumb" onClick={() => setVista("lista")}>
              <span>General ∧</span> / <b>Mis mantenimientos ∧</b> / <b>General ∧</b>
            </div>

            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 20 }}>{mantenimientoSeleccionado?.tipo || "Mantenimiento Trimestral"}</div>

            <div className="detail-grid">
              <div className="field">
                <label>máquina:</label>
                <select className="select" value={maquina} onChange={e=>setMaquina(e.target.value)}>
                  <option>Pinacho Mustang 225</option>
                  <option>Torno CNC HAAS</option>
                  <option>Fresadora Bridgeport</option>
                  <option>Compresor Atlas</option>
                </select>
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
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span>cada</span>
                  <input className="input" style={{width:80}} value={fechaAlta} onChange={e=>setFechaAlta(e.target.value)} />
                  <span>días</span>
                </div>
              </div>
              <div className="field">
                <label>tiempo de realización:</label>
                <select className="select" value={tiempo} onChange={e=>setTiempo(e.target.value)}>
                  <option>1 Día</option>
                  <option>2 Días</option>
                  <option>1 Semana</option>
                  <option>2 Semanas</option>
                </select>
              </div>
            </div>

            <div className="field" style={{marginTop:20}}>
              <label>meses:</label>
              <div className="pill-group">
                {MESES_ALL.map(mes=>(
                  <span key={mes} className={`pill clickable ${mesesSel.includes(mes) ? "selected" : ""}`} onClick={()=>toggleMes(mes)}>{mes}</span>
                ))}
              </div>
              {periodo === "Trimestral" && <div className="note">Solo se muestra cuando seleccionás "Trimestral" - como en tu boceto</div>}
            </div>

            <div className="tareas">
              <div className="section-title" style={{ marginBottom: 12 }}>TAREAS</div>
              {tareas.map((t) => (
                <div key={t.id} className="task">
                  <input type="checkbox" checked={t.done} onChange={() => setTareas(tareas.map(x => x.id===t.id ? {...x, done:!x.done} : x))} />
                  <span className="task-text" style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "#999" : "#111" }}>{t.text}</span>
                  <button className="task-del" onClick={()=>setTareas(tareas.filter(x=>x.id!==t.id))}>✕</button>
                </div>
              ))}
              <div className="task-new">
                <input placeholder="Añade una tarea + Enter" value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && handleAddTarea()} />
                <button className="btn-black" onClick={handleAddTarea}>+ Añadir</button>
              </div>
            </div>

            <div className="personal">
              <div className="section-title">PERSONAL ASIGNADO</div>
              <div className="avatars">
                {asignados.map((a, i) => (
                  <div key={i} className="avatar" title={a}>
                    {a}
                    <span className="remove" onClick={()=>setAsignados(asignados.filter((_,idx)=>idx!==i))}>✕</span>
                  </div>
                ))}
                <div className="avatar add" onClick={() => setShowAddAsignado(!showAddAsignado)}>+</div>
              </div>
              {showAddAsignado && (
                <div className="personal-input">
                  <input placeholder="Iniciales ej: AB" value={nuevoAsignado} onChange={e=>setNuevoAsignado(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==='Enter' && nuevoAsignado){setAsignados([...asignados, nuevoAsignado]); setNuevoAsignado(""); setShowAddAsignado(false)}}} />
                  <button className="btn-black" onClick={()=>{ if(nuevoAsignado){setAsignados([...asignados, nuevoAsignado]); setNuevoAsignado(""); setShowAddAsignado(false)}}}>Agregar</button>
                </div>
              )}
            </div>

            <div className="footer">
              <button className="btn-ghost" onClick={() => setVista("lista")}>Cancelar</button>
              <button className="btn-black" onClick={handleGuardar}>Guardar Cambios</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
