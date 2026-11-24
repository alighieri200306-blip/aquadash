import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Soporte() {
  const [configSistema, setConfigSistema] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [miRol, setMiRol] = useState(null);
  const [editando, setEditando] = useState(null);

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

  const cargarConfig = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .order("clave", { ascending: true });
      if (error) throw error;
      const configObj = {};
      (data || []).forEach(c => { configObj[c.clave] = c; });
      setConfigSistema(configObj);
    } catch (err) {
      console.error("Error al cargar config:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    async function iniciar() {
      await cargarMiRol();
      await cargarConfig();
    }
    iniciar();
  }, [cargarMiRol, cargarConfig]);

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
      setConfigSistema({
        ...configSistema,
        [clave]: { ...configSistema[clave], valor }
      });
      setEditando(null);
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError(err.message);
    }
  }

  const esAdmin = miRol === "Administrador";

  if (cargando)
    return (
      <div className="soporte-container">
        <p>Cargando configuración del sistema...</p>
      </div>
    );
  if (error)
    return (
      <div className="soporte-container">
        <p className="mensaje-error">Error: {error}</p>
      </div>
    );

  const configItems = [
    {
      clave: "nombre_sistema",
      titulo: "Nombre del sistema",
      descripcion: "Identificador del sistema acuapónico",
      tipo: "texto",
    },
    {
      clave: "biomasa",
      titulo: "Biomasa activa",
      descripcion: "Especies actualmente en el sistema",
      tipo: "texto",
    },
    {
      clave: "geolocalizacion",
      titulo: "Geolocalización",
      descripcion: "Ubicación del sistema (coordenadas o dirección)",
      tipo: "texto",
    },
    {
      clave: "modo_operacion",
      titulo: "Modo de operación",
      descripcion: "Manual, Híbrido o Automático",
      tipo: "select",
      opciones: ["Manual", "Híbrido", "Automático"],
    },
    {
      clave: "frecuencia_muestreo",
      titulo: "Frecuencia de muestreo",
      descripcion: "Intervalo entre lecturas de sensores (minutos)",
      tipo: "numero",
    },
    {
      clave: "fotoperiodo",
      titulo: "Fotoperiodo",
      descripcion: "Horas de luz por día",
      tipo: "numero",
    },
    {
      clave: "modo_vacaciones",
      titulo: "Modo vacaciones",
      descripcion: "Reduce alertas no críticas durante ausencias prolongadas",
      tipo: "booleano",
    },
  ];

  return (
    <div className="soporte-container">
      <section className="seccion-info">
        <h2>Información del Sistema</h2>
        <p className="subtitulo-seccion">
          Datos generales y configuración del sistema acuapónico
        </p>
      </section>

      <section className="seccion-config-sistema">
        <h3>Configuración del Sistema</h3>
        <p className="descripcion-seccion">
          Ajusta los parámetros operativos del sistema
        </p>

        <div className="lista-config">
          {configItems.map((item) => {
            const config = configSistema[item.clave];
            const valorActual = config?.valor || "";

            return (
              <div key={item.clave} className="config-item">
                <div className="config-info">
                  <h4>{item.titulo}</h4>
                  <p>{item.descripcion}</p>
                </div>

                <div className="config-control">
                  {editando === item.clave ? (
                    <>
                      {item.tipo === "select" ? (
                        <select
                          value={valorActual}
                          onChange={(e) =>
                            actualizarConfig(item.clave, e.target.value)
                          }
                          onBlur={() => setEditando(null)}
                          autoFocus
                          className="input-edicion"
                        >
                          {item.opciones.map((op) => (
                            <option key={op}>{op}</option>
                          ))}
                        </select>
                      ) : item.tipo === "numero" ? (
                        <input
                          type="number"
                          value={valorActual}
                          onChange={(e) =>
                            actualizarConfig(item.clave, e.target.value)
                          }
                          onBlur={() => setEditando(null)}
                          autoFocus
                          className="input-edicion"
                        />
                      ) : item.tipo === "booleano" ? (
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={valorActual === "true"}
                            onChange={(e) =>
                              actualizarConfig(
                                item.clave,
                                e.target.checked.toString()
                              )
                            }
                            disabled={!esAdmin}
                          />
                          <span className="slider"></span>
                        </label>
                      ) : (
                        <input
                          type="text"
                          value={valorActual}
                          onChange={(e) =>
                            actualizarConfig(item.clave, e.target.value)
                          }
                          onBlur={() => setEditando(null)}
                          autoFocus
                          className="input-edicion"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <span className="valor-actual">
                        {item.tipo === "booleano"
                          ? valorActual === "true"
                            ? "✅ Activado"
                            : "⚪ Desactivado"
                          : valorActual || "—"}
                      </span>
                      {esAdmin && (
                        <button
                          onClick={() => setEditando(item.clave)}
                          className="btn-editar"
                          aria-label={`Editar ${item.titulo}`}
                        >
                          ✏️
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Información técnica */}
      <section className="seccion-info-tecnica">
        <h3>Información Técnica</h3>
        <div className="grid-info-tecnica">
          <div className="info-card">
            <span className="info-label">Versión del sistema</span>
            <span className="info-valor">1.0.0</span>
          </div>
          <div className="info-card">
            <span className="info-label">Última actualización</span>
            <span className="info-valor">
              {new Date().toLocaleDateString("es-MX")}
            </span>
          </div>
          <div className="info-card">
            <span className="info-label">Base de datos</span>
            <span className="info-valor">Supabase (PostgreSQL)</span>
          </div>
          <div className="info-card">
            <span className="info-label">Comunicación</span>
            <span className="info-valor">MQTT en línea</span>
          </div>
        </div>
      </section>

      <footer className="footer-config">
        <p>Última actualización: {new Date().toLocaleString("es-MX")}</p>
      </footer>
    </div>
  );
}