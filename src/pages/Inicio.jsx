import {
  getSystemInfo,
  getWaterParameters,
  getPlantParameters,
  getMaintenanceTasks,
} from "../data/mockData";
import{
  useState,
  useEffect
}from "react";
import{supabase}from"../supabaseClient";

export default function Inicio() {
  const sistema = getSystemInfo();
  const parametrosAgua = getWaterParameters();
  const parametrosPlantas = getPlantParameters();
  const tareas = getMaintenanceTasks();
  const [nombreUsuario,setNombreUsuario]=useState("Usuario");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
  async function obtenerNombreUsuario() {
    try {
      // 1. Obtener el usuario autenticado actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Error al obtener usuario:", userError);
        return;
      }

      // 2. Consultar la tabla profiles para obtener el nombre
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
    } finally {
      setCargando(false);
    }
  }

  obtenerNombreUsuario();
}, []);

  return (
    // En JSX usamos "className" en lugar de "class"
    <div className="layout-principal">
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <nav className="barra-navegacion">
        <div className="logo-nav">
          <span className="icono-logo">☒</span>
          <div className="texto-logo">
            <span>AquaDash</span>
            <span>Monitoreo</span>
          </div>
        </div>

        <ul className="enlaces-nav">
            <li className="activo">
            <a href="#">Inico</a>
          </li>
          <li>
            <a href="#">Histórico</a>
          </li>
          <li>
            <a href="#">Configuración</a>
          </li>
          <li>
            <a href="#">Mantenimiento</a>
          </li>
          <li>
            <a href="#">Alertas</a>
          </li>
          <li>
            <a href="#">Grabaciones</a>
          </li>
        </ul>
      </nav>

      {/* CABECERA SUPERIOR */}
      <header className="cabecera">
        <div className="cabecera-info">
          <h1>AquaDash - Monitoreo Acuapónico</h1>
          <p>{cargando ? "Cargando..." : `Bienvenido de nuevo ${nombreUsuario}.`}</p>
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

        {/* Contenido de las plantas */}
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
                  {/* Aquí iría el video real */}
                  <p>Señal de video...</p>
                </div>
              </div>
              <div className="camara-tarjeta">
                <div className="camara-header">
                  <h3>CAM-02. Zona de Plantas</h3>
                </div>
                <div className="camara-feed placeholder-feed">
                  {/* Aquí iría el video real */}
                  <p>Señal de video...</p>
                </div>
              </div>
            </div>
          </section>

          {/* MANTENIMIENTO */}
          <section className="seccion-tareas">
            <h2>Protocolos preventivos</h2>
            <div className="panel-tareas">
              <h3>Próximas Tareas programadas</h3>

              {/* TAREAS DINÁMICAS */}
              {tareas.map((tarea) => (
                <div
                  key={tarea.id}
                  className={`tarea-item ${tarea.destacada ? "destacada" : ""}`}
                >
                  <div className="tarea-info">
                    <h4>{tarea.titulo}</h4>
                    <p>{tarea.descripcion}</p>
                  </div>
                  {tarea.destacada && (
                    <span className="etiqueta-hoy">{tarea.fecha}</span>
                  )}
                  {!tarea.destacada && <span>{tarea.fecha}</span>}
                </div>
              ))}

              <button className="btn-calendario">
                Ver Calendario Completo de Mantenimiento
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

