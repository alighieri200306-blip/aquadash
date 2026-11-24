import { useState } from "react";
import Navbar from "../components/Navbar";
import GestionUsuarios from "./configuracion/GestionUsuarios";
import Sensores from "./configuracion/Sensores";
import General from "./configuracion/general";

export default function Configuracion() {
  const [pestañaActiva, setPestañaActiva] = useState("usuarios");

  const pestañas = [
    { id: "general", texto: "General" },
    { id: "soporte", texto: "Soporte Técnico" },
    { id: "usuarios", texto: "Gestión de Usuarios" },
    { id: "sensores", texto: "Sensores y calibración" },
  ];

  return (
    <div>
      <Navbar />
      <div className="configuracion-container">
        {/* Header principal */}
        <header className="config-header">
          <h1>Configuración del sistema</h1>
          <p>Ajusta los parámetros operativos, identidades y políticas del sistema acuapónico</p>
          <div className="config-meta">
            <span className="biomasa">Biomasa activa: Mollys & Menta</span>
            <span className="sincronizacion">
              ÚLTIMA SINCRONIZACIÓN: MQTT en línea · 18:46:12
            </span>
          </div>
        </header>

        {/* Sub-pestañas */}
        <div className="sub-pestanas">
          {pestañas.map((p) => (
            <button
              key={p.id}
              className={pestañaActiva === p.id ? "activa" : ""}
              onClick={() => setPestañaActiva(p.id)}
            >
              {p.texto}
            </button>
          ))}
        </div>

        {/* Contenido según pestaña */}
        {pestañaActiva === "general" && (
          <div className="seccion-vacia">
            <h2>General</h2>
            <p>Configuración general del sistema (próximamente)</p>
          </div>
        )}
        {pestañaActiva === "soporte" && (
          <div className="seccion-vacia">
            <h2>Soporte Técnico</h2>
            <p>Soporte técnico (próximamente)</p>
          </div>
        )}
        {pestañaActiva === "general" && <General />}
        {pestañaActiva === "usuarios" && <GestionUsuarios />}
        {pestañaActiva === "sensores" && <Sensores />}
      </div>
    </div>
  );
}