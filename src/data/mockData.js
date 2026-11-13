// src/data/mockData.js

// 1. Función para los parámetros del agua (Usa Objetos {})
export function getWaterParameters() {
  return {
    nivel: { valor: 86, estado: "Estable", rango: "80-95%" },
    ph: { valor: 7.12, estado: "Óptimo", rango: "6.8-7.4" },
    temperatura: { valor: 25.8, estado: "Normal", rango: "24-28 °C" },
    luz: { valor: "ON", estado: "Activa", rango: "Apagado programado en 20 minutos" },
  };
}
// 1.1. Función para los parámetros de las plantas
export function getPlantParameters() {
  return {
    humedad: { valor: 50, estado: "Estable", rango: "60-80%" },
    bombaNFT: { valor: "OFF", estado: "Activa", rango: "Bomba siempre activa" },
    cicloRiego: { valor: "04:29:10", estado: "Inactiva", rango: "Frecuencia cada 6 horas" },
    luzPlantas: { valor: "ON", estado: "Activa", rango: "Frecuencia de encendido/apagado: 16h iluminación/ 8h oscuridad" },
  };
}

// 2. Función para la información general de la cabecera
export function getSystemInfo() {
  return {
    usuario: "Edu",
    estadoGlobal: "Estable",
    biomasa: "Mollys & Menta",
  };
}

// 3. Función para las tareas de mantenimiento (Usa un Arreglo [] con Objetos {} adentro)
export function getMaintenanceTasks() {
  return [
    {
      id: 1,
      titulo: "Limpieza de filtros",
      fecha: "HOY",
      descripcion:
        "Limpieza y purga del filtro mecánico. Tiempo estimado de 15 minutos.",
      destacada: true,
    },
    {
      id: 2,
      titulo: "Calibración electrodo pH",
      fecha: "Mañana",
      descripcion: "",
      destacada: false,
    },
  ];
}
