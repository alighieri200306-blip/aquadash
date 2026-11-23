import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";

export default function Mantenimiento() {
  const [tareas, setTareas] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [mesActual, setMesActual] = useState(new Date());
  const [mostrarFormTarea, setMostrarFormTarea] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [miRol, setMiRol] = useState(null);
  
  const [formData, setFormData] = useState({
    titulo: "", descripcion: "", tipo: "Preventivo", estado: "Pendiente",
    prioridad: "Media", fecha_programada: new Date().toISOString().split('T')[0],
    asignado_a: "", notas: ""
  });

  const cargarMiRol = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data: perfil } = await supabase.from("profiles").select("rol").eq("id", session.user.id).single();
      setMiRol(perfil?.rol || null);
    } catch (err) { console.error(err); }
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const { data: tareasData, error: tareasError } = await supabase
        .from("maintenance_tasks")
        .select("*")
        .order("fecha_programada", { ascending: true });
      if (tareasError) throw tareasError;
      setTareas(tareasData || []);

      const { data: compData, error: compError } = await supabase
        .from("components")
        .select("*")
        .order("fecha_instalacion", { ascending: false });
      if (compError) throw compError;
      setComponentes(compData || []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    async function iniciar() {
      await cargarMiRol();
      await cargarDatos();
    }
    iniciar();
  }, [cargarMiRol, cargarDatos]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleGuardarTarea(e) {
    e.preventDefault();
    if (miRol !== "Administrador") { alert("Solo Administradores pueden gestionar tareas."); return; }
    
    try {
      if (editandoId) {
        const { error } = await supabase.from("maintenance_tasks").update(formData).eq("id", editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("maintenance_tasks").insert([formData]);
        if (error) throw error;
      }
      setFormData({ titulo: "", descripcion: "", tipo: "Preventivo", estado: "Pendiente", prioridad: "Media", fecha_programada: new Date().toISOString().split('T')[0], asignado_a: "", notas: "" });
      setEditandoId(null);
      setMostrarFormTarea(false);
      await cargarDatos();
    } catch (err) {
      console.error("Error al guardar tarea:", err);
      setError(err.message);
    }
  }

  function handleEditarTarea(tarea) {
    setFormData(tarea);
    setEditandoId(tarea.id);
    setMostrarFormTarea(true);
  }

  async function handleEliminarTarea(id) {
    if (miRol !== "Administrador") { alert("Solo Administradores pueden eliminar tareas."); return; }
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      const { error } = await supabase.from("maintenance_tasks").delete().eq("id", id);
      if (error) throw error;
      await cargarDatos();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError(err.message);
    }
  }

  async function actualizarEstadoTarea(id, nuevoEstado) {
    if (miRol !== "Administrador") { alert("Solo Administradores pueden cambiar estados."); return; }
    try {
      const updateData = { estado: nuevoEstado };
      if (nuevoEstado === "Completada") {
        updateData.fecha_completada = new Date().toISOString().split('T')[0];
      }
      const { error } = await supabase.from("maintenance_tasks").update(updateData).eq("id", id);
      if (error) throw error;
      await cargarDatos();
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError(err.message);
    }
  }

  // Filtrar tareas
  const tareasFiltradas = useMemo(() => {
    if (filtroEstado === "todas") return tareas;
    return tareas.filter(t => t.estado === filtroEstado);
  }, [tareas, filtroEstado]);

  // Contadores
  const contadores = useMemo(() => ({
    pendientes: tareas.filter(t => t.estado === "Pendiente").length,
    progreso: tareas.filter(t => t.estado === "En progreso").length,
    completadas: tareas.filter(t => t.estado === "Completada").length,
    total: tareas.length,
  }), [tareas]);

  // Calendario
  const diasEnMes = useMemo(() => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasSemana = primerDia.getDay();
    const totalDias = ultimoDia.getDate();
    
    const dias = [];
    for (let i = 0; i < diasSemana; i++) dias.push(null);
    for (let i = 1; i <= totalDias; i++) dias.push(i);
    return dias;
  }, [mesActual]);

  const tareasPorDia = useMemo(() => {
    const mapa = {};
    tareas.forEach(t => {
      const fecha = new Date(t.fecha_programada);
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(t);
    });
    return mapa;
  }, [tareas]);

  // Vida útil de componentes
  const componentesConProgreso = useMemo(() => {
    return componentes.map(c => {
      const instalacion = new Date(c.fecha_instalacion);
      const ahora = new Date();
      const mesesTranscurridos = (ahora.getFullYear() - instalacion.getFullYear()) * 12 + (ahora.getMonth() - instalacion.getMonth());
      const porcentaje = Math.min(100, (mesesTranscurridos / c.vida_util_meses) * 100);
      const mesesRestantes = Math.max(0, c.vida_util_meses - mesesTranscurridos);
      return { ...c, mesesTranscurridos, porcentaje, mesesRestantes };
    });
  }, [componentes]);

  const esAdmin = miRol === "Administrador";

  if (cargando) return <div><Navbar /><div className="mantenimiento-container"><p>Cargando...</p></div></div>;
  if (error) return <div><Navbar /><div className="mantenimiento-container"><p className="mensaje-error">Error: {error}</p></div></div>;

  return (
    <div>
      <Navbar />
      <div className="mantenimiento-container">
        <header className="mantenimiento-header">
          <h1>Mantenimiento</h1>
          <p className="subtitulo">Programación, seguimiento y vida útil de componentes del sistema</p>
        </header>

        {/* Contadores */}
        <section className="seccion-contadores" aria-label="Resumen de tareas">
          <div className="grid-contadores">
            <div className="contador-card pendiente">
              <span className="contador-numero">{contadores.pendientes}</span>
              <span className="contador-label">Pendientes</span>
            </div>
            <div className="contador-card progreso">
              <span className="contador-numero">{contadores.progreso}</span>
              <span className="contador-label">En progreso</span>
            </div>
            <div className="contador-card completada">
              <span className="contador-numero">{contadores.completadas}</span>
              <span className="contador-label">Completadas</span>
            </div>
            <div className="contador-card total">
              <span className="contador-numero">{contadores.total}</span>
              <span className="contador-label">Total</span>
            </div>
          </div>
        </section>

        {/* Calendario */}
        <section className="seccion-calendario" aria-label="Calendario de mantenimiento">
          <div className="calendario-header">
            <h2>Calendario de Mantenimiento</h2>
            <div className="calendario-navegacion">
              <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))} aria-label="Mes anterior">←</button>
              <span>{mesActual.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</span>
              <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))} aria-label="Mes siguiente">→</button>
            </div>
          </div>
          
          <div className="calendario-grid">
            <div className="dia-header">Dom</div>
            <div className="dia-header">Lun</div>
            <div className="dia-header">Mar</div>
            <div className="dia-header">Mié</div>
            <div className="dia-header">Jue</div>
            <div className="dia-header">Vie</div>
            <div className="dia-header">Sáb</div>
            
            {diasEnMes.map((dia, idx) => {
              if (dia === null) return <div key={idx} className="dia-vacio"></div>;
              const key = `${mesActual.getFullYear()}-${mesActual.getMonth()}-${dia}`;
              const tareasDia = tareasPorDia[key] || [];
              const esHoy = new Date().toDateString() === new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString();
              
              return (
                <div key={idx} className={`dia ${esHoy ? "hoy" : ""} ${tareasDia.length > 0 ? "con-tareas" : ""}`}>
                  <span className="dia-numero">{dia}</span>
                  {tareasDia.length > 0 && (
                    <div className="tareas-dia">
                      {tareasDia.slice(0, 2).map(t => (
                        <div key={t.id} className={`tarea-mini ${t.estado.toLowerCase().replace(" ", "-")}`}>
                          {t.titulo}
                        </div>
                      ))}
                      {tareasDia.length > 2 && <div className="tareas-extra">+{tareasDia.length - 2} más</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Lista de tareas */}
        <section className="seccion-tareas" aria-label="Lista de tareas">
          <div className="tareas-header">
            <h2>Tareas de Mantenimiento</h2>
            <div className="tareas-controles">
              <div className="filtro-estado">
                <label htmlFor="filtro-estado">Filtrar:</label>
                <select id="filtro-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                  <option value="todas">Todas ({contadores.total})</option>
                  <option value="Pendiente">Pendientes ({contadores.pendientes})</option>
                  <option value="En progreso">En progreso ({contadores.progreso})</option>
                  <option value="Completada">Completadas ({contadores.completadas})</option>
                </select>
              </div>
              {esAdmin && (
                <button className="btn-agregar" onClick={() => { setMostrarFormTarea(true); setEditandoId(null); }}>
                  + Nueva tarea
                </button>
              )}
            </div>
          </div>

          {mostrarFormTarea && esAdmin && (
            <form className="formulario-tarea" onSubmit={handleGuardarTarea}>
              <h4>{editandoId ? "Editar Tarea" : "Nueva Tarea"}</h4>
              <div className="grid-form">
                <div className="campo-form">
                  <label htmlFor="titulo">Título *</label>
                  <input id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
                </div>
                <div className="campo-form">
                  <label htmlFor="tipo">Tipo *</label>
                  <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange}>
                    <option>Preventivo</option>
                    <option>Correctivo</option>
                    <option>Calibración</option>
                    <option>Revisión</option>
                  </select>
                </div>
                <div className="campo-form">
                  <label htmlFor="prioridad">Prioridad *</label>
                  <select id="prioridad" name="prioridad" value={formData.prioridad} onChange={handleChange}>
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                    <option>Urgente</option>
                  </select>
                </div>
                <div className="campo-form">
                  <label htmlFor="fecha_programada">Fecha programada *</label>
                  <input id="fecha_programada" name="fecha_programada" type="date" value={formData.fecha_programada} onChange={handleChange} required />
                </div>
                <div className="campo-form">
                  <label htmlFor="asignado_a">Asignado a</label>
                  <input id="asignado_a" name="asignado_a" value={formData.asignado_a} onChange={handleChange} />
                </div>
                <div className="campo-form campo-completo">
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="2"></textarea>
                </div>
                <div className="campo-form campo-completo">
                  <label htmlFor="notas">Notas</label>
                  <textarea id="notas" name="notas" value={formData.notas} onChange={handleChange} rows="2"></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-guardar">{editandoId ? "Guardar cambios" : "Crear tarea"}</button>
                <button type="button" className="btn-cancelar" onClick={() => setMostrarFormTarea(false)}>Cancelar</button>
              </div>
            </form>
          )}

          <div className="lista-tareas">
            {tareasFiltradas.length === 0 ? (
              <p className="vacio">No hay tareas {filtroEstado !== "todas" ? `con estado "${filtroEstado}"` : ""}.</p>
            ) : (
              tareasFiltradas.map(tarea => (
                <div key={tarea.id} className={`tarea-card ${tarea.estado.toLowerCase().replace(" ", "-")}`}>
                  <div className="tarea-info">
                    <div className="tarea-header">
                      <h3>{tarea.titulo}</h3>
                      <span className={`badge-prioridad ${tarea.prioridad.toLowerCase()}`}>{tarea.prioridad}</span>
                    </div>
                    <p className="tarea-descripcion">{tarea.descripcion}</p>
                    <div className="tarea-meta">
                      <span className="tarea-tipo">{tarea.tipo}</span>
                      <span className="tarea-fecha">📅 {new Date(tarea.fecha_programada).toLocaleDateString("es-MX")}</span>
                      {tarea.asignado_a && <span className="tarea-asignado">👤 {tarea.asignado_a}</span>}
                    </div>
                  </div>
                  <div className="tarea-acciones">
                    <select
                      value={tarea.estado}
                      onChange={(e) => actualizarEstadoTarea(tarea.id, e.target.value)}
                      disabled={!esAdmin}
                      className="select-estado"
                    >
                      <option>Pendiente</option>
                      <option>En progreso</option>
                      <option>Completada</option>
                      <option>Cancelada</option>
                    </select>
                    {esAdmin && (
                      <div className="botones-accion">
                        <button onClick={() => handleEditarTarea(tarea)} className="btn-editar" aria-label="Editar tarea">✏️</button>
                        <button onClick={() => handleEliminarTarea(tarea.id)} className="btn-eliminar" aria-label="Eliminar tarea">🗑️</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Vida útil de componentes */}
        <section className="seccion-componentes" aria-label="Vida útil de componentes">
          <h2>Vida Útil de Componentes</h2>
          <p className="descripcion-seccion">Monitoreo del desgaste y tiempo restante de los componentes</p>
          
          <div className="lista-componentes">
            {componentesConProgreso.length === 0 ? (
              <p className="vacio">No hay componentes registrados.</p>
            ) : (
              componentesConProgreso.map(comp => (
                <div key={comp.id} className="componente-card">
                  <div className="componente-info">
                    <h3>{comp.nombre}</h3>
                    <span className="componente-tipo">{comp.tipo}</span>
                    <span className={`componente-estado ${comp.estado.toLowerCase()}`}>{comp.estado}</span>
                  </div>
                  <div className="componente-progreso">
                    <div className="progreso-info">
                      <span>{comp.mesesTranscurridos} / {comp.vida_util_meses} meses</span>
                      <span className="progreso-porcentaje">{comp.porcentaje.toFixed(0)}%</span>
                    </div>
                    <div className="barra-progreso">
                      <div 
                        className={`barra ${comp.porcentaje >= 90 ? "critico" : comp.porcentaje >= 70 ? "advertencia" : "ok"}`}
                        style={{ width: `${comp.porcentaje}%` }}
                      ></div>
                    </div>
                    <span className="meses-restantes">
                      {comp.mesesRestantes > 0 ? `${comp.mesesRestantes} meses restantes` : "⚠️ Vida útil agotada"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="footer-config">
          <p>Última actualización: {new Date().toLocaleString("es-MX")}</p>
        </footer>
      </div>
    </div>
  );
}