import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar"; 

// Rangos óptimos
const RANGOS_OPTIMOS = {
  pH: [6.8, 7.4],
  Temperatura: [24, 28],
  "Nivel de agua": [80, 95],
  Humedad: [60, 80],
  "Oxígeno disuelto": [6, 8],
};

const UNIDADES = {
  pH: "pH",
  Temperatura: "°C",
  "Nivel de agua": "%",
  Humedad: "%",
  "Oxígeno disuelto": "mg/L",
};

export default function Historico() {
  const [rango, setRango] = useState("24h");
  const [parametro, setParametro] = useState("Temperatura");
  const [lecturas, setLecturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginaTabla, setPaginaTabla] = useState(1);
  const porPagina = 10;

  const cargarLecturas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const horas = { "6h": 6, "12h": 12, "24h": 24, "7d": 168 }[rango] || 24;
      const desde = new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("readings")
        .select(`id, valor, unidad, leido_en, devices!inner(tipo, categoria)`)
        .eq("devices.tipo", parametro)
        .eq("devices.categoria", "Sensor")
        .gte("leido_en", desde)
        .order("leido_en", { ascending: true });

      if (error) throw error;

      const formateadas = (data || []).map((r) => ({
        hora: new Date(r.leido_en).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        fecha: new Date(r.leido_en).toLocaleDateString("es-MX"),
        valor: Number(r.valor),
        unidad: r.unidad,
        timestamp: r.leido_en,
      }));

      setLecturas(formateadas);
    } catch (err) {
      console.error("Error al cargar lecturas:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [rango, parametro]);

  useEffect(() => {
    async function iniciar() {
      await cargarLecturas();
    }
    iniciar();
  }, [cargarLecturas]);

  const stats = useMemo(() => {
    if (lecturas.length === 0) {
      return { prom: 0, min: 0, max: 0, enRango: 0 };
    }
    const valores = lecturas.map((l) => l.valor);
    const prom = valores.reduce((a, b) => a + b, 0) / valores.length;
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const [minR, maxR] = RANGOS_OPTIMOS[parametro] || [0, 100];
    const enRango = valores.filter((v) => v >= minR && v <= maxR).length;
    const porcentaje = Math.round((enRango / valores.length) * 100);
    return {
      prom: prom.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      enRango: porcentaje,
    };
  }, [lecturas, parametro]);

  const statsTodos = useMemo(() => {
    const resultado = {};
    Object.keys(RANGOS_OPTIMOS).forEach((p) => {
      const vals = lecturas
        .filter((l) => l.parametro === p)
        .map((l) => l.valor);
      if (vals.length === 0) {
        resultado[p] = { enRango: 0, prom: 0, min: 0, max: 0 };
        return;
      }
      const [minR, maxR] = RANGOS_OPTIMOS[p];
      const enRango = vals.filter((v) => v >= minR && v <= maxR).length;
      resultado[p] = {
        enRango: Math.round((enRango / vals.length) * 100),
        prom: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
        min: Math.min(...vals).toFixed(2),
        max: Math.max(...vals).toFixed(2),
      };
    });
    return resultado;
  }, [lecturas]);

  const totalPaginas = Math.max(1, Math.ceil(lecturas.length / porPagina));
  const lecturasPagina = lecturas.slice(
    (paginaTabla - 1) * porPagina,
    paginaTabla * porPagina
  );

  function exportarCSV(tipo = "actual") {
    const encabezado = "Fecha,Hora,Valor,Unidad\n";
    const filas = lecturas
      .map((l) => `${l.fecha},${l.hora},${l.valor},${l.unidad}`)
      .join("\n");
    const blob = new Blob([encabezado + filas], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico_${parametro.toLowerCase()}_${rango}_${tipo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const unidad = UNIDADES[parametro] || "";
  const [minRango, maxRango] = RANGOS_OPTIMOS[parametro] || [0, 100];

  if (cargando) {
    return (
      <div>
        <Navbar />
        <div className="historico-container" role="status" aria-live="polite">
          <p>Cargando datos históricos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="historico-container" role="alert">
          <p className="mensaje-error">Error al cargar datos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar /> {/*Navbar al inicio */}
      <div className="historico-container">
        <header className="historico-header">
          <h1>Datos e Históricos</h1>
          <p className="subtitulo">
            Análisis histórico, variabilidad y tendencias multivariables del
            sistema
          </p>
        </header>

        <section className="controles-historico" aria-label="Filtros del histórico">
          <div className="grupo-filtros">
            <span id="label-escala" className="label-filtro">
              Escala:
            </span>
            <div className="tabs-tiempo" role="tablist" aria-labelledby="label-escala">
              {["6h", "12h", "24h", "7d"].map((r) => (
                <button
                  key={r}
                  role="tab"
                  aria-selected={rango === r}
                  className={rango === r ? "activo" : ""}
                  onClick={() => {
                    setRango(r);
                    setPaginaTabla(1);
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grupo-filtros">
            <span id="label-parametro" className="label-filtro">
              Parámetro:
            </span>
            <div className="tabs-parametro" role="tablist" aria-labelledby="label-parametro">
              {Object.keys(RANGOS_OPTIMOS).map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={parametro === p}
                  className={parametro === p ? "activo" : ""}
                  onClick={() => {
                    setParametro(p);
                    setPaginaTabla(1);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="seccion-grafica" aria-label={`Gráfica de ${parametro}`}>
          <h2>Tendencias · Últimas {rango}</h2>
          <p className="descripcion-grafica">
            Parámetros de {parametro.toLowerCase()}
          </p>

          <div className="contenedor-grafica">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={lecturas}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 12 }}
                  aria-label="Hora de lectura"
                />
                <YAxis
                  domain={[minRango - 2, maxRango + 2]}
                  tick={{ fontSize: 12 }}
                  aria-label={`Valor en ${unidad}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                  }}
                  labelFormatter={(label) => `Hora: ${label}`}
                  formatter={(value) => [`${value} ${unidad}`, parametro]}
                />
                <Legend />
                <ReferenceLine
                  y={minRango}
                  stroke="#e74c3c"
                  strokeDasharray="3 3"
                  label={{
                    value: `Mín ${minRango}`,
                    position: "insideBottomRight",
                    fill: "#e74c3c",
                    fontSize: 11,
                  }}
                />
                <ReferenceLine
                  y={maxRango}
                  stroke="#e74c3c"
                  strokeDasharray="3 3"
                  label={{
                    value: `Máx ${maxRango}`,
                    position: "insideTopRight",
                    fill: "#e74c3c",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name={`${parametro} (${unidad})`}
                  stroke="#228be6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="seccion-rango" aria-label="Tiempo dentro del rango óptimo">
          <h2>Tiempo en rango óptimo</h2>
          <p className="descripcion-seccion">
            % del periodo dentro de lo configurado
          </p>
          <div className="grid-stats">
            {Object.entries(RANGOS_OPTIMOS).map(([p, [min, max]]) => (
              <div key={p} className="stat-card" role="status">
                <span className="stat-label">{p}</span>
                <span className="stat-valor">
                  {statsTodos[p]?.enRango ?? 0}%
                </span>
                <span className="stat-sub">
                  Mín {min} · Máx {max}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="seccion-resumen" aria-label="Resumen de estadísticas">
          <h2>Resumen de Estadísticas</h2>
          <p className="descripcion-seccion">
            Últimas {rango} · {lecturas.length} lecturas
          </p>
          <div className="grid-stats">
            <div className="stat-card">
              <span className="stat-label">{parametro} promedio</span>
              <span className="stat-valor">
                {stats.prom} {unidad}
              </span>
              <span className="stat-sub">
                Mín {stats.min} · Máx {stats.max}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">En rango óptimo</span>
              <span className="stat-valor">{stats.enRango}%</span>
              <span className="stat-sub">
                Rango: {minRango} - {maxRango} {unidad}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total de lecturas</span>
              <span className="stat-valor">{lecturas.length}</span>
              <span className="stat-sub">En el periodo seleccionado</span>
            </div>
          </div>
        </section>

        <section className="seccion-exportacion" aria-label="Exportación de datos">
          <h2>Exportación de datos</h2>
          <p className="descripcion-seccion">
            Reportes históricos periódicos, datos brutos y descarga media
          </p>
          <div className="grid-export">
            <div className="export-card">
              <h3>Reporte Semanal</h3>
              <p>Variabilidad de {parametro.toLowerCase()} semanal</p>
              <div className="export-botones">
                <button onClick={() => exportarCSV("semanal")}>CSV</button>
              </div>
            </div>
            <div className="export-card">
              <h3>Reporte Mensual</h3>
              <p>Concentrado de {parametro.toLowerCase()}</p>
              <div className="export-botones">
                <button onClick={() => exportarCSV("mensual")}>CSV</button>
              </div>
            </div>
            <div className="export-card">
              <h3>Datos Brutos</h3>
              <p>Lecturas globales de {parametro.toLowerCase()}</p>
              <div className="export-botones">
                <button onClick={() => exportarCSV("brutos")}>CSV</button>
              </div>
            </div>
          </div>
        </section>

        <section className="seccion-tabla" aria-label="Registros de muestreo">
          <h2>Registros de muestreo</h2>
          <p className="descripcion-seccion">
            Telemetría de sensores cada 30 minutos
          </p>

          {lecturas.length === 0 ? (
            <p className="vacio">
              No hay lecturas disponibles para este rango y parámetro.
            </p>
          ) : (
            <>
              <div
                className="tabla-responsive"
                role="region"
                aria-label="Tabla de lecturas"
                tabIndex="0"
              >
                <table>
                  <caption className="sr-only">
                    Lecturas de {parametro} en las últimas {rango}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Hora</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Valor</th>
                      <th scope="col">Unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturasPagina.map((l, i) => (
                      <tr key={l.timestamp || i}>
                        <td>{l.hora}</td>
                        <td>{l.fecha}</td>
                        <td>{l.valor}</td>
                        <td>{l.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="paginacion" aria-label="Paginación de registros">
                <button
                  onClick={() => setPaginaTabla((p) => Math.max(1, p - 1))}
                  disabled={paginaTabla === 1}
                  aria-label="Página anterior"
                >
                  ← Anterior
                </button>
                <span aria-live="polite">
                  Página {paginaTabla} de {totalPaginas}
                </span>
                <button
                  onClick={() =>
                    setPaginaTabla((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaTabla === totalPaginas}
                  aria-label="Página siguiente"
                >
                  Siguiente →
                </button>
              </nav>
            </>
          )}
        </section>
      </div>
    </div>
  );
}