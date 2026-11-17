import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

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
      navigate("/login");
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⊠</span>
        <span className="navbar-titulo">AquaDash Monitoreo</span>
      </div>
      <ul className="navbar-enlaces">
        {enlaces.map((enlace) => (
          <li key={enlace.ruta}>
            <Link
              to={enlace.ruta}
              className={`navbar-link ${location.pathname === enlace.ruta ? "activo" : ""}`}
            >
              {enlace.texto}
            </Link>
          </li>
        ))}
        <li>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </li>
      </ul>
    </nav>
  );
}