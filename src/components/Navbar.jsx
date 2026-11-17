import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const enlaces = [
    { ruta: "/", texto: "Inicio" },
    { ruta: "/historico", texto: "Histórico" },
    { ruta: "/configuracion", texto: "Configuración" },
    { ruta: "/mantenimiento", texto: "Mantenimiento" },
    { ruta: "/alertas", texto: "Alertas" },
    { ruta: "/grabaciones", texto: "Grabaciones" },
  ];

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      if (onLogout) onLogout();
      navigate("/login");
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⊠</span>
        <span className="navbar-titulo">AquaDash Monitoreo</span>
      </div>
      <div className="navbar-enlaces">
        {enlaces.map((enlace) => (
          <button
            key={enlace.ruta}
            className={`navbar-link ${location.pathname === enlace.ruta ? "activo" : ""}`}
            onClick={() => navigate(enlace.ruta)}
          >
            {enlace.texto}
          </button>
        ))}
        <button className="btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}