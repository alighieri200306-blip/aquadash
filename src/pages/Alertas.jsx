import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroSeveridad, setFiltroSeveridad] = useState("todas");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [miRol, setMiRol] = useState(null);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tipo: "Sensor",
    severidad: "Advertencia",
    estado: "Activa",
    origen: "",
    valor_detectado: "",
    umbral: "",
  });

  const cargarMiRol = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data: perfil } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", session.user.id)
        .single();
      setMiRol(perfil?.rol || null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const cargarAlertas = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAlertas(data || []);
    } catch (err) {
      console.error("Error al cargar alertas:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    async function iniciar() {
      await cargarMiRol();
      await cargarAlertas();
    }
    iniciar();
  }, [cargarMiRol, cargarAlertas]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden gestionar alertas.");
      return;
    }

    try {
      if (editandoId) {
        const { error } = await supabase
          .from("alerts")
          .update(formData)
          .eq("id", editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("alerts")
          .insert([formData]);
        if (error) throw error;
      }
      setFormData({
        titulo: "",
        descripcion: "",
        tipo: "Sensor",
        severidad: "Advertencia",
        estado: "Activa",
        origen: "",
        valor_detectado: "",
        umbral: "",
      });
      setEditandoId(null);
      setMostrarForm(false);
      await cargarAlertas();
    } catch (err) {
      console.error("Error al guardar:", err);
      setError(err.message);
    }
  }

  function handleEditar(alerta) {
    setFormData(alerta);
    setEditandoId(alerta.id);
    setMostrarForm(true);
  }

  async function handleEliminar(id) {
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden eliminar alertas.");
      return;
    }
    if (!confirm("¿Eliminar esta alerta?")) return;
    try {
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await cargarAlertas();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError(err.message);
    }
  }

  async function actualizarEstado(id, nuevoEstado) {
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden cambiar estados.");
      return;
    }
    try {
      const updateData = { estado: nuevoEstado };
      const { data: { session } } = await supabase.auth.getSession();
      const { data: perfil } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", session?.user?.id)
        .single();
      
      if (nuevoEstado === "Reconocida") {
        updateData.reconocida_por = perfil?.nombre || "Admin";
        updateData.fecha_reconocida = new Date().toISOString();
      }
      if (nuevoEstado === "Resuelta") {
        updateData.resuelta_por = perfil?.nombre || "Admin";
        updateData.fecha_resuelta = new Date().toISOString();
      }

      const { error } = await supabase
        .from("alerts")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
      await cargarAlertas();
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError(err.message);
    }
  }

  // Filtrar alertas
  const alertasFiltradas = useMemo(() => {
    return alertas.filter((a) => {
      if (filtroEstado !== "todas" && a.estado !== filtroEstado) return false;
      if (filtroSeveridad !== "todas" && a.severidad !== filtroSeveridad) return false;
      return true;
    });
  }, [alertas, filtroEstado, filtroSeveridad]);

  // Contadores
  const contadores = useMemo(
    () => ({
      activas: alertas.filter((a) => a.estado === "Activa").length,
      reconocidas: alertas.filter((a) => a.estado === "Reconocida").length,
      resueltas: alertas.filter((a) => a.estado === "Resuelta").length,
      criticas: alertas.filter((a) => a.severidad === "Crítica" && a.estado !== "Resuelta").length,
      total: alertas.length,
    }),
    [alertas]
  );

  const esAdmin = miRol === "Administrador";

  if (cargando)
    return (
      <div>
        <Navbar />
        <div className="alertas-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div>
        <Navbar />
        <div className="alertas-container">
          <p className="mensaje-error">Error: {error}</p>
        </div>
      </div>
    );

  return (
    <div>
      <Navbar />
      <div className="alertas-container">
        <header className="alertas-header">
          <h1>Alertas</h1>
          <p className="subtitulo">
            Monitoreo, reconocimiento y resolución de alertas del sistema
          </p>
        </header>

        {/* Contadores */}
        <section className="seccion-contadores" aria-label="Resumen de alertas">
          <div className="grid-contadores">
            <div className="contador-card activa">
              <span className="contador-numero">{contadores.activas}</span>
              <span className="contador-label">Activas</span>
            </div>
            <div className="contador-card reconocida">
              <span className="contador-numero">{contadores.reconocidas}</span>
              <span className="contador-label">Reconocidas</span>
            </div>
            <div className="contador-card resuelta">
              <span className="contador-numero">{contadores.resueltas}</span>
              <span className="contador-label">Resueltas</span>
            </div>
            <div className="contador-card critica">
              <span className="contador-numero">{contadores.criticas}</span>
              <span className="contador-label">Críticas pendientes</span>
            </div>
            <div className="contador-card total">
              <span className="contador-numero">{contadores.total}</span>
              <span className="contador-label">Total</span>
            </div>
          </div>
        </section>

        {/* Filtros */}
        <section className="seccion-filtros" aria-label="Filtros de alertas">
          <div className="filtros-controles">
            <div className="filtro-grupo">
              <label htmlFor="filtro-estado">Estado:</label>
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todas">Todas ({contadores.total})</option>
                <option value="Activa">Activas ({contadores.activas})</option>
                <option value="Reconocida">
                  Reconocidas ({contadores.reconocidas})
                </option>
                <option value="Resuelta">Resueltas ({contadores.resueltas})</option>
              </select>
            </div>
            <div className="filtro-grupo">
              <label htmlFor="filtro-severidad">Severidad:</label>
              <select
                id="filtro-severidad"
                value={filtroSeveridad}
                onChange={(e) => setFiltroSeveridad(e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="Crítica">Críticas</option>
                <option value="Advertencia">Advertencias</option>
                <option value="Informativa">Informativas</option>
              </select>
            </div>
            {esAdmin && (
              <button
                className="btn-agregar"
                onClick={() => {
                  setMostrarForm(true);
                  setEditandoId(null);
                }}
              >
                + Nueva alerta
              </button>
            )}
          </div>
        </section>

        {/* Formulario */}
        {mostrarForm && esAdmin && (
          <form className="formulario-alerta" onSubmit={handleGuardar}>
            <h4>{editandoId ? "Editar Alerta" : "Nueva Alerta"}</h4>
            <div className="grid-form">
              <div className="campo-form campo-completo">
                <label htmlFor="titulo">Título *</label>
                <input
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="campo-form">
                <label htmlFor="tipo">Tipo *</label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                >
                  <option>Sensor</option>
                  <option>Actuador</option>
                  <option>Sistema</option>
                  <option>Seguridad</option>
                </select>
              </div>
              <div className="campo-form">
                <label htmlFor="severidad">Severidad *</label>
                <select
                  id="severidad"
                  name="severidad"
                  value={formData.severidad}
                  onChange={handleChange}
                >
                  <option>Crítica</option>
                  <option>Advertencia</option>
                  <option>Informativa</option>
                </select>
              </div>
              <div className="campo-form">
                <label htmlFor="origen">Origen</label>
                <input
                  id="origen"
                  name="origen"
                  placeholder="Ej: Sensor pH-01"
                  value={formData.origen}
                  onChange={handleChange}
                />
              </div>
              <div className="campo-form">
                <label htmlFor="valor_detectado">Valor detectado</label>
                <input
                  id="valor_detectado"
                  name="valor_detectado"
                  placeholder="Ej: 6.4 pH"
                  value={formData.valor_detectado}
                  onChange={handleChange}
                />
              </div>
              <div className="campo-form">
                <label htmlFor="umbral">Umbral</label>
                <input
                  id="umbral"
                  name="umbral"
                  placeholder="Ej: Mín 6.8 pH"
                  value={formData.umbral}
                  onChange={handleChange}
                />
              </div>
              <div className="campo-form campo-completo">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-guardar">
                {editandoId ? "Guardar cambios" : "Crear alerta"}
              </button>
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setMostrarForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de alertas */}
        <section className="seccion-lista" aria-label="Lista de alertas">
          {alertasFiltradas.length === 0 ? (
            <p className="vacio">
              No hay alertas {filtroEstado !== "todas" || filtroSeveridad !== "todas"
                ? "con los filtros seleccionados"
                : ""}.
            </p>
          ) : (
            <div className="lista-alertas">
              {alertasFiltradas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`alerta-card ${alerta.estado.toLowerCase()} ${alerta.severidad.toLowerCase()}`}
                >
                  <div className="alerta-header">
                    <div className="alerta-titulo-severidad">
                      <h3>{alerta.titulo}</h3>
                      <span
                        className={`badge-severidad ${alerta.severidad.toLowerCase()}`}
                      >
                        {alerta.severidad}
                      </span>
                    </div>
                    <span className={`badge-estado ${alerta.estado.toLowerCase()}`}>
                      {alerta.estado}
                    </span>
                  </div>
                  <p className="alerta-descripcion">{alerta.descripcion}</p>
                  <div className="alerta-meta">
                    {alerta.origen && (
                      <span className="meta-item">
                        📍 {alerta.origen}
                      </span>
                    )}
                    {alerta.valor_detectado && (
                      <span className="meta-item">
                        🔍 {alerta.valor_detectado}
                      </span>
                    )}
                    {alerta.umbral && (
                      <span className="meta-item">
                        📏 {alerta.umbral}
                      </span>
                    )}
                    <span className="meta-item">
                      🕐 {new Date(alerta.created_at).toLocaleString("es-MX")}
                    </span>
                  </div>
                  {alerta.reconocida_por && (
                    <div className="alerta-reconocida">
                      <span>
                        ✅ Reconocida por {alerta.reconocida_por} el{" "}
                        {new Date(alerta.fecha_reconocida).toLocaleString("es-MX")}
                      </span>
                    </div>
                  )}
                  {alerta.resuelta_por && (
                    <div className="alerta-resuelta">
                      <span>
                        ✔️ Resuelta por {alerta.resuelta_por} el{" "}
                        {new Date(alerta.fecha_resuelta).toLocaleString("es-MX")}
                      </span>
                    </div>
                  )}
                  <div className="alerta-acciones">
                    <select
                      value={alerta.estado}
                      onChange={(e) => actualizarEstado(alerta.id, e.target.value)}
                      disabled={!esAdmin}
                      className="select-estado"
                    >
                      <option>Activa</option>
                      <option>Reconocida</option>
                      <option>Resuelta</option>
                    </select>
                    {esAdmin && (
                      <div className="botones-accion">
                        <button
                          onClick={() => handleEditar(alerta)}
                          className="btn-editar"
                          aria-label="Editar alerta"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleEliminar(alerta.id)}
                          className="btn-eliminar"
                          aria-label="Eliminar alerta"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="footer-config">
          <p>Última actualización: {new Date().toLocaleString("es-MX")}</p>
        </footer>
      </div>
    </div>
  );
}