import { useState } from "react";
import GestionUsuarios from "./configuracion/GestionUsuarios";
import Navbar from "../components/Navbar";

export default function Configuracion() {
  const [pestañaActiva, setPestañaActiva] = useState("usuarios");

  return (
    <div>
        <Navbar />
    <div className="configuracion-container">
      <header>
        <h1>Configuración del Sistema</h1>
        <p>Ajusta los parámetros operativos, identidades y políticas del sistema acuapónico</p>
      </header>
    </div>

      {/* Sub-pestañas */}
      <div className="sub-pestanas">
        <button 
          className={pestañaActiva === "general" ? "activa" : ""}
          onClick={() => setPestañaActiva("general")}
        >
          General
        </button>
        <button 
          className={pestañaActiva === "usuarios" ? "activa" : ""}
          onClick={() => setPestañaActiva("usuarios")}
        >
          Gestión de Usuarios
        </button>
        <button 
          className={pestañaActiva === "sensores" ? "activa" : ""}
          onClick={() => setPestañaActiva("sensores")}
        >
          Sensores y calibración
        </button>
      </div>

      {/* Contenido según pestaña */}
      {pestañaActiva === "general" && <div><p>Configuración General (próximamente)</p></div>}
      {pestañaActiva === "usuarios" && <GestionUsuarios />}
      {pestañaActiva === "sensores" && <div><p>Gestión de Sensores (próximamente)</p></div>}
    </div>
  );
}