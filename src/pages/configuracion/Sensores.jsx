import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Sensores() {
  const [dispositivos, setDispositivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("todos"); // 'todos', 'Sensor', 'Actuador'
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [miRol, setMiRol] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "", categoria: "Sensor", tipo: "", modelo: "", intervalo_min: 5, estado: "En línea", ultima_lectura: ""
  });

  useEffect(() => {
    async function iniciar() {
      await cargarMiRol();
      await cargarDispositivos();
    }
    iniciar();
  }, []);

  async function cargarMiRol() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data: perfil } = await supabase.from("profiles").select("rol").eq("id", session.user.id).single();
      setMiRol(perfil?.rol || null);
    } catch (err) { console.error(err); }
  }

  async function cargarDispositivos() {
    try {
      const { data, error } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setDispositivos(data || []);
    } catch (err) {
      console.error("Error al cargar dispositivos:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (miRol !== "Administrador") { alert("Solo Administradores pueden gestionar dispositivos."); return; }
    
    try {
      if (editandoId) {
        const { error } = await supabase.from("devices").update(formData).eq("id", editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("devices").insert([formData]);
        if (error) throw error;
      }
      setFormData({ nombre: "", categoria: "Sensor", tipo: "", modelo: "", intervalo_min: 5, estado: "En línea", ultima_lectura: "" });
      setEditandoId(null);
      setMostrarFormulario(false);
      await cargarDispositivos();
    } catch (err) {
      console.error("Error al guardar:", err);
      setError(err.message);
    }
  }

  function handleEditar(device) {
    setFormData(device);
    setEditandoId(device.id);
    setMostrarFormulario(true);
  }

  async function handleEliminar(id) {
    if (miRol !== "Administrador") { alert("Solo Administradores pueden eliminar."); return; }
    if (!confirm("¿Seguro que deseas eliminar este dispositivo?")) return;
    try {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
      await cargarDispositivos();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError(err.message);
    }
  }

  const dispositivosFiltrados = dispositivos.filter(d => filtro === "todos" ? true : d.categoria === filtro);
  const totalSensores = dispositivos.filter(d => d.categoria === "Sensor").length;
  const totalActuadores = dispositivos.filter(d => d.categoria === "Actuador").length;
  const esAdmin = miRol === "Administrador";

  if (cargando) return <div className="gestion-sensores"><p>Cargando dispositivos...</p></div>;
  if (error) return <div className="gestion-sensores"><p className="mensaje-error">Error: {error}</p></div>;

  return (
    <div className="gestion-sensores">
      <section className="seccion-info">
        <h2>Información de los Sensores</h2>
        <p className="subtitulo-seccion">Datos generales de los sensores dentro del sistema</p>
      </section>

      <section className="seccion-dispositivos">
        <div className="controles-sensores">
          <div className="filtros-tabs">
            <button className={filtro === "todos" ? "activo" : ""} onClick={() => setFiltro("todos")}>
              Todos los Dispositivos ({dispositivos.length})
            </button>
            <button className={filtro === "Sensor" ? "activo" : ""} onClick={() => setFiltro("Sensor")}>
              Sensores ({totalSensores})
            </button>
            <button className={filtro === "Actuador" ? "activo" : ""} onClick={() => setFiltro("Actuador")}>
              Actuadores ({totalActuadores})
            </button>
          </div>
          {esAdmin && (
            <button className="btn-agregar" onClick={() => { setMostrarFormulario(true); setEditandoId(null); setFormData({ nombre: "", categoria: "Sensor", tipo: "", modelo: "", intervalo_min: 5, estado: "En línea", ultima_lectura: "" }); }}>
              + Agregar sensor o actuador
            </button>
          )}
        </div>

        {mostrarFormulario && esAdmin && (
          <form className="formulario-dispositivo" onSubmit={handleGuardar}>
            <h4>{editandoId ? "Editar Dispositivo" : "Nuevo Dispositivo"}</h4>
            <div className="grid-form">
              <input name="nombre" placeholder="Nombre (ej: Sensor pH-01)" value={formData.nombre} onChange={handleChange} required />
              <select name="categoria" value={formData.categoria} onChange={handleChange}>
                <option value="Sensor">Sensor</option>
                <option value="Actuador">Actuador</option>
              </select>
              <input name="tipo" placeholder="Tipo (ej: pH, Bomba)" value={formData.tipo} onChange={handleChange} required />
              <input name="modelo" placeholder="Modelo (ej: lH500)" value={formData.modelo} onChange={handleChange} />
              <input name="intervalo_min" type="number" placeholder="Intervalo (min)" value={formData.intervalo_min} onChange={handleChange} />
              <select name="estado" value={formData.estado} onChange={handleChange}>
                <option value="En línea">En línea</option>
                <option value="Advertencia">Advertencia</option>
                <option value="Desconectado">Desconectado</option>
              </select>
              <input name="ultima_lectura" placeholder="Última lectura (ej: 7.12 pH)" value={formData.ultima_lectura} onChange={handleChange} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-guardar">Guardar</button>
              <button type="button" className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
            </div>
          </form>
        )}

        <table className="tabla-dispositivos">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>TIPO</th>
              <th>Modelo</th>
              <th>INTERVALO</th>
              <th>ESTADO</th>
              <th>ÚLTIMA LECTURA</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {dispositivosFiltrados.map((d) => (
              <tr key={d.id}>
                <td>{d.nombre}</td>
                <td>{d.tipo}</td>
                <td>{d.modelo || "—"}</td>
                <td>{d.categoria === "Sensor" ? `${d.intervalo_min} min` : "—"}</td>
                <td>
                  <span className={`badge-estado ${d.estado === "En línea" ? "en-linea" : d.estado === "Advertencia" ? "advertencia" : "desconectado"}`}>
                    {d.estado === "En línea" ? "🟢" : d.estado === "Advertencia" ? "🔵" : "⚪"} {d.estado}
                  </span>
                </td>
                <td>{d.ultima_lectura || "—"}</td>
                <td className="acciones-cell">
                  <button className="btn-accion" title="Recalibrar" onClick={() => alert("Recalibración simulada")}>🔄</button>
                  {esAdmin && <button className="btn-accion" title="Editar" onClick={() => handleEditar(d)}>☰</button>}
                  {esAdmin && <button className="btn-accion btn-eliminar-icon" title="Eliminar" onClick={() => handleEliminar(d.id)}>🗑</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="footer-config">
          <p>Última actualización: {new Date().toLocaleString("es-MX")}</p>
        </footer>
      </section>
    </div>
  );
}