import {
  getSystemInfo,
  getWaterParameters,
  getPlantParameters,
} from "../data/mockData";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";

export default function Inicio() {
  const sistema = getSystemInfo();
  const parametrosAgua = getWaterParameters();
  const parametrosPlantas = getPlantParameters();

  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [cargando, setCargando] = useState(true);
  const [proximasTareas, setProximasTareas] = useState([]);

  // Función para obtener el nombre del usuario autenticado
  async function obtenerNombreUsuario() {
    try {
      const {
        data: { session },
        error: userError,
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (userError || !user) {
        console.error("Error al obtener usuario:", userError);
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", user.id)
        .single();

      if (perfilError) {
        console.error("Error al obtener perfil:", perfilError);
      } else if (perfil) {
        setNombreUsuario(perfil.nombre);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
    }
  }

  // FUNCIÓN: Cargar próximas tareas desde Supabase
  async function cargarProximasTareas() {
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("*")
        .in("estado", ["Pendiente", "En progreso"])
        .gte("fecha_programada", hoy)
        .order("fecha_programada", { ascending: true })
        .limit(3);

      if (error) throw error;
      setProximasTareas(data || []);
    } catch (err) {
      console.error("Error al cargar próximas tareas:", err);
    }
  }

  // useEffect reestructurado con funciones definidas ANTES
  useEffect(() => {
    async function iniciar() {
      await obtenerNombreUsuario();
      await cargarProximasTareas();
      setCargando(false);
    }
    iniciar();
  }, []);

  function calcularEtiquetaFecha(fechaProgramada) {
    // Compara strings YYYY-MM-DD directamente para evitar desfase de zona horaria
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const mananaStr = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, "0")}-${String(manana.getDate()).padStart(2, "0")}`;

    if (fechaProgramada === hoyStr) return "HOY";
    if (fechaProgramada === mananaStr) return "Mañana";

    // Para otras fechas, mostrar día y mes
    const [year, month, day] = fechaProgramada.split("-").map(Number);
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div>
      <Navbar />

      {/* CABECERA SUPERIOR */}
      <header className="cabecera">
        <div className="cabecera-info">
          <h1>AquaDash - Monitoreo Acuapónico</h1>
          <p>
            {cargando ? "Cargando..." : `Bienvenido de nuevo ${nombreUsuario}.`}
          </p>
          <p>Estado: {sistema.estadoGlobal}.</p>
        </div>
        <div className="cabecera-estado">
          <div className="reloj">18:42:02</div>
          <div className="biomasa">Biomasa activa: {sistema.biomasa}</div>
        </div>
      </header>

      {/* CONTENIDO DE LA PÁGINA (TARJETAS) */}
      <main className="contenido-dashboard">
        <h2>Parámetros del agua</h2>
        <section className="grilla-tarjetas">
          <div className="tarjeta">
            <span>{parametrosAgua.nivel.estado}</span>
            <h3>NIVEL DE AGUA</h3>
            <p className="valor">{parametrosAgua.nivel.valor}%</p>
            <p className="rango">{parametrosAgua.nivel.rango}</p>
          </div>
          <div className="tarjeta">
            <span>{parametrosAgua.ph.estado}</span>
            <h3>NIVEL DE PH</h3>
            <p className="valor">{parametrosAgua.ph.valor} pH</p>
            <p className="rango">{parametrosAgua.ph.rango}</p>
          </div>
          <div className="tarjeta">
            <span>{parametrosAgua.temperatura.estado}</span>
            <h3>TEMPERATURA</h3>
            <p className="valor">{parametrosAgua.temperatura.valor} °C</p>
            <p className="rango">{parametrosAgua.temperatura.rango}</p>
          </div>
          <div className="tarjeta">
            <span>{parametrosAgua.luz.estado}</span>
            <h3>LUZ</h3>
            <p className="valor">{parametrosAgua.luz.valor}</p>
            <p className="rango">{parametrosAgua.luz.rango}</p>
          </div>
        </section>

        <h2>Parámetros de las plantas</h2>
        <section className="grilla-tarjetas">
          <div className="tarjeta">
            <span>{parametrosPlantas.humedad.estado}</span>
            <h3>HUMEDAD DEL SUELO</h3>
            <p className="valor">{parametrosPlantas.humedad.valor}% HR</p>
            <p className="rango">{parametrosPlantas.humedad.rango}</p>
          </div>
          <div className="tarjeta">
            <span>{parametrosPlantas.bombaNFT.estado}</span>
            <h3>BOMBA NFT</h3>
            <p className="valor">{parametrosPlantas.bombaNFT.valor}</p>
            <p className="rango">{parametrosPlantas.bombaNFT.rango}</p>
          </div>
          <div className="tarjeta">
            <span>{parametrosPlantas.cicloRiego.estado}</span>
            <h3>CICLO DE RIEGO</h3>
            <p className="valor">{parametrosPlantas.cicloRiego.valor}</p>
            <p className="rango">{parametrosPlantas.cicloRiego.rango}</p>
          </div>
          <div className="tarjeta">
            <span>{parametrosPlantas.luzPlantas.estado}</span>
            <h3>LUZ</h3>
            <p className="valor">{parametrosPlantas.luzPlantas.valor}</p>
            <p className="rango">{parametrosPlantas.luzPlantas.rango}</p>
          </div>
        </section>

        {/* SECCIÓN INFERIOR: CÁMARAS Y MANTENIMIENTO */}
        <div className="layout-inferior">
          {/* CÁMARAS */}
          <section className="seccion-camaras">
            <h2>Visión en vivo</h2>
            <div className="grilla-camaras">
              <div className="camara-tarjeta">
                <div className="camara-header">
                  <h3>CAM-01. Tanque de Peces</h3>
                </div>
                <div className="camara-feed placeholder-feed">
                  <p>Señal de video...</p>
                </div>
              </div>
              <div className="camara-tarjeta">
                <div className="camara-header">
                  <h3>CAM-02. Zona de Plantas</h3>
                </div>
                <div className="camara-feed placeholder-feed">
                  <p>Señal de video...</p>
                </div>
              </div>
            </div>
          </section>

          {/* MANTENIMIENTO - AHORA CONECTADO A SUPABASE */}
          <section className="seccion-tareas">
            <h2>Protocolos preventivos</h2>
            <div className="panel-tareas">
              <h3>Próximas Tareas programadas</h3>

              {proximasTareas.length === 0 ? (
                <p className="vacio">No hay tareas programadas próximamente.</p>
              ) : (
                proximasTareas.map((tarea) => {
                  const etiqueta = calcularEtiquetaFecha(
                    tarea.fecha_programada,
                  );
                  const esHoy = etiqueta === "HOY";

                  return (
                    <div
                      key={tarea.id}
                      className={`tarea-item ${esHoy ? "destacada" : ""}`}
                    >
                      <div className="tarea-info">
                        <h4>{tarea.titulo}</h4>
                        <p>{tarea.descripcion || "Sin descripción"}</p>
                      </div>
                      <span
                        className={`etiqueta-fecha ${esHoy ? "etiqueta-hoy" : ""}`}
                      >
                        {etiqueta}
                      </span>
                    </div>
                  );
                })
              )}

              {/* BOTÓN CONVERTIDO EN ENLACE */}
              <Link to="/mantenimiento" className="btn-calendario">
                Ver Calendario Completo de Mantenimiento
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
