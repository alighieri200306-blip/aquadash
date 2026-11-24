import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function General() {
  const [rangos, setRangos] = useState([]);
  const [automatizaciones, setAutomatizaciones] = useState([]);
  const [configSistema, setConfigSistema] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [miRol, setMiRol] = useState(null);
  const [editandoRango, setEditandoRango] = useState(null);

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

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const { data: rangosData, error: rangosError } = await supabase
        .from("optimal_ranges")
        .select("*")
        .order("parametro", { ascending: true });
      if (rangosError) throw rangosError;
      setRangos(rangosData || []);

      const { data: autoData, error: autoError } = await supabase
        .from("automation_rules")
        .select("*")
        .order("hora_inicio", { ascending: true });
      if (autoError) throw autoError;
      setAutomatizaciones(autoData || []);

      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("clave, valor");
      if (configError) throw configError;
      const configObj = {};
      (configData || []).forEach(c => { configObj[c.clave] = c.valor; });
      setConfigSistema(configObj);
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

  async function actualizarRango(id, campo, valor) {
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden editar rangos.");
      return;
    }
    try {
      const { error } = await supabase
        .from("optimal_ranges")
        .update({ [campo]: valor, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await cargarDatos();
    } catch (err) {
      console.error("Error al actualizar rango:", err);
      setError(err.message);
    }
  }

  async function toggleAutomatizacion(id, activa) {
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden cambiar automatizaciones.");
      return;
    }
    try {
      const { error } = await supabase
        .from("automation_rules")
        .update({ activa, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await cargarDatos();
    } catch (err) {
      console.error("Error al actualizar automatización:", err);
      setError(err.message);
    }
  }

  async function actualizarConfig(clave, valor) {
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden cambiar la configuración.");
      return;
    }
    try {
      const { error } = await supabase
        .from("system_config")
        .update({ valor, updated_at: new Date().toISOString() })
        .eq("clave", clave);
      if (error) throw error;
      setConfigSistema({ ...configSistema, [clave]: valor });
    } catch (err) {
      console.error("Error al actualizar config:", err);
      setError(err.message);
    }
  }

  async function controlEmergencia(accion) {
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden usar controles de emergencia.");
      return;
    }
    const confirmMsg = accion === "parar" 
      ? "¿DETENER todas las bombas y luces? Esta acción es inmediata."
      : "¿Reanudar operación normal?";
    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from("system_config")
        .update({ valor: accion === "parar" ? "emergencia" : "normal", updated_at: new Date().toISOString() })
        .eq("clave", "estado_emergencia");
      if (error) throw error;
      alert(accion === "parar" ? "Sistema en EMERGENCIA. Bombas y luces detenidas." : "Sistema reanudado.");
    } catch (err) {
      console.error("Error en control de emergencia:", err);
      setError(err.message);
    }
  }

  const esAdmin = miRol === "Administrador";

  if (cargando)
    return (
      <div className="config-general-container">
        <p>Cargando configuración...</p>
      </div>
    );
  if (error)
    return (
      <div className="config-general-container">
        <p className="mensaje-error">Error: {error}</p>
      </div>
    );

  return (
    <div className="config-general-container">
      {/* Rangos óptimos */}
      <section className="seccion-config" aria-label="Rangos óptimos">
        <h2>Rangos Óptimos</h2>
        <p className="descripcion-seccion">
          Configura los valores mínimos y máximos aceptables para cada parámetro
        </p>

        <div className="tabla-rangos">
          <table>
            <thead>
              <tr>
                <th>Parámetro</th>
                <th>Mínimo</th>
                <th>Máximo</th>
                <th>Unidad</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {rangos.map((rango) => (
                <tr key={rango.id}>
                  <td>{rango.parametro}</td>
                  <td>
                    {esAdmin && editandoRango === rango.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={rango.valor_min}
                        onChange={(e) => actualizarRango(rango.id, "valor_min", parseFloat(e.target.value))}
                        onBlur={() => setEditandoRango(null)}
                        autoFocus
                        className="input-edicion"
                      />
                    ) : (
                      <span onDoubleClick={() => esAdmin && setEditandoRango(rango.id)}>
                        {rango.valor_min}
                      </span>
                    )}
                  </td>
                  <td>
                    {esAdmin && editandoRango === rango.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={rango.valor_max}
                        onChange={(e) => actualizarRango(rango.id, "valor_max", parseFloat(e.target.value))}
                        onBlur={() => setEditandoRango(null)}
                        className="input-edicion"
                      />
                    ) : (
                      <span onDoubleClick={() => esAdmin && setEditandoRango(rango.id)}>
                        {rango.valor_max}
                      </span>
                    )}
                  </td>
                  <td>{rango.unidad}</td>
                  {esAdmin && (
                    <td>
                      <button
                        onClick={() => setEditandoRango(rango.id)}
                        className="btn-editar"
                        aria-label={`Editar rango de ${rango.parametro}`}
                      >
                        ✏️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ciclos automáticos */}
      <section className="seccion-config" aria-label="Ciclos automáticos">
        <h2>Ciclos Automáticos</h2>
        <p className="descripcion-seccion">
          Programa los horarios de riego, iluminación y alimentación
        </p>

        <div className="lista-automatizaciones">
          {automatizaciones.map((auto) => (
            <div key={auto.id} className={`automatizacion-card ${auto.activa ? "activa" : "inactiva"}`}>
              <div className="auto-info">
                <h3>{auto.nombre}</h3>
                <span className="auto-tipo">{auto.tipo}</span>
                <div className="auto-horarios">
                  <span>🕐 {auto.hora_inicio} - {auto.hora_fin}</span>
                </div>
                <div className="auto-dias">
                  {auto.dias_semana.map(dia => (
                    <span key={dia} className="dia-badge">{dia}</span>
                  ))}
                </div>
              </div>
              <div className="auto-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={auto.activa}
                    onChange={(e) => toggleAutomatizacion(auto.id, e.target.checked)}
                    disabled={!esAdmin}
                  />
                  <span className="slider"></span>
                </label>
                <span className="estado-texto">{auto.activa ? "Activa" : "Inactiva"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Configuración del sistema */}
      <section className="seccion-config" aria-label="Configuración del sistema">
        <h2>Configuración del Sistema</h2>
        <p className="descripcion-seccion">
          Ajusta los parámetros generales de operación
        </p>

        <div className="grid-config">
          <div className="config-item">
            <label htmlFor="modo-operacion">Modo de operación</label>
            <select
              id="modo-operacion"
              value={configSistema.modo_operacion || "Automático"}
              onChange={(e) => actualizarConfig("modo_operacion", e.target.value)}
              disabled={!esAdmin}
            >
              <option>Manual</option>
              <option>Híbrido</option>
              <option>Automático</option>
            </select>
          </div>

          <div className="config-item">
            <label htmlFor="frecuencia-muestreo">Frecuencia de muestreo (min)</label>
            <input
              id="frecuencia-muestreo"
              type="number"
              min="1"
              max="60"
              value={configSistema.frecuencia_muestreo || "5"}
              onChange={(e) => actualizarConfig("frecuencia_muestreo", e.target.value)}
              disabled={!esAdmin}
            />
          </div>

          <div className="config-item">
            <label htmlFor="fotoperiodo">Fotoperiodo (horas/día)</label>
            <input
              id="fotoperiodo"
              type="number"
              min="0"
              max="24"
              value={configSistema.fotoperiodo || "12"}
              onChange={(e) => actualizarConfig("fotoperiodo", e.target.value)}
              disabled={!esAdmin}
            />
          </div>

          <div className="config-item">
            <label className="toggle-config">
              <input
                type="checkbox"
                checked={configSistema.modo_vacaciones === "true"}
                onChange={(e) => actualizarConfig("modo_vacaciones", e.target.checked.toString())}
                disabled={!esAdmin}
              />
              <span>Modo vacaciones</span>
            </label>
            <p className="config-hint">Reduce alertas no críticas</p>
          </div>
        </div>
      </section>

      {/* Control de emergencia */}
      {esAdmin && (
        <section className="seccion-emergencia" aria-label="Control de emergencia">
          <h2>Control de Emergencia</h2>
          <p className="descripcion-seccion">
            Detén o reanuda el sistema inmediatamente
          </p>

          <div className="botones-emergencia">
            <button
              onClick={() => controlEmergencia("parar")}
              className="btn-parar"
            >
              🛑 DETENER Sistema
            </button>
            <button
              onClick={() => controlEmergencia("reanudar")}
              className="btn-reanudar"
            >
              ▶️ Reanudar Sistema
            </button>
          </div>
        </section>
      )}

      <footer className="footer-config">
        <p>Última actualización: {new Date().toLocaleString("es-MX")}</p>
      </footer>
    </div>
  );
}