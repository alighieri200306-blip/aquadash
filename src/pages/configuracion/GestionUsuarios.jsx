import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [editandoId, setEditandoId] = useState(null);
  const [rolTemporal, setRolTemporal] = useState("");

  async function cargarUsuarios() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nombre, rol, estado, notificaciones, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // ✅ useEffect corregido
  useEffect(() => {
    async function iniciar() {
      await cargarUsuarios();
    }
    iniciar();
  }, []);

  async function actualizarRol(id, nuevoRol) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ rol: nuevoRol })
        .eq("id", id);

      if (error) throw error;
      
      setUsuarios(usuarios.map(u => 
        u.id === id ? { ...u, rol: nuevoRol } : u
      ));
      setEditandoId(null);
    } catch (err) {
      console.error("Error al actualizar rol:", err);
      setError(err.message);
    }
  }

  async function actualizarEstado(id, nuevoEstado) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ estado: nuevoEstado })
        .eq("id", id);

      if (error) throw error;
      
      setUsuarios(usuarios.map(u => 
        u.id === id ? { ...u, estado: nuevoEstado } : u
      ));
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setError(err.message);
    }
  }

  async function eliminarUsuario(id) {
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      setError(err.message);
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtro === "todos") return true;
    if (filtro === "activos") return u.estado === "activo";
    if (filtro === "inactivos") return u.estado === "inactivo";
    if (filtro === "administradores") return u.rol === "Administrador";
    if (filtro === "operadores") return u.rol === "Operador";
    if (filtro === "visitantes") return u.rol === "Visitante";
    return true;
  });

  if (cargando) {
    return <div className="gestion-usuarios"><p>Cargando usuarios...</p></div>;
  }

  if (error) {
    return <div className="gestion-usuarios"><p className="mensaje-error">Error: {error}</p></div>;
  }

  return (
    <div className="gestion-usuarios">
      <header>
        <h1>Gestión de Usuarios</h1>
        <p>Gestiona quién puede visualizar métricas, alterar setpoints o accionar actuadores</p>
      </header>

      <div className="filtros-container">
        <label htmlFor="filtro-usuarios">Filtrar por:</label>
        <select 
          id="filtro-usuarios"
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)}
          className="select-filtro"
        >
          <option value="todos">Todos los usuarios</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="administradores">Administradores</option>
          <option value="operadores">Operadores</option>
          <option value="visitantes">Visitantes</option>
        </select>
      </div>

      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Notificaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.nombre || "Sin nombre"}</td>
              <td>
                {editandoId === usuario.id ? (
                  <select
                    value={rolTemporal}
                    onChange={(e) => setRolTemporal(e.target.value)}
                    className="select-edicion"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Operador">Operador</option>
                    <option value="Visitante">Visitante</option>
                  </select>
                ) : (
                  <span className={`badge badge-${usuario.rol.toLowerCase()}`}>
                    {usuario.rol}
                  </span>
                )}
              </td>
              <td>
                <label className="toggle-estado">
                  <input
                    type="checkbox"
                    checked={usuario.estado === "activo"}
                    onChange={(e) => 
                      actualizarEstado(usuario.id, e.target.checked ? "activo" : "inactivo")
                    }
                  />
                  <span className={`badge badge-${usuario.estado}`}>
                    {usuario.estado}
                  </span>
                </label>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={usuario.notificaciones}
                  onChange={async (e) => {
                    const { error } = await supabase
                      .from("profiles")
                      .update({ notificaciones: e.target.checked })
                      .eq("id", usuario.id);
                    
                    if (!error) {
                      setUsuarios(usuarios.map(u => 
                        u.id === usuario.id ? { ...u, notificaciones: e.target.checked } : u
                      ));
                    }
                  }}
                />
              </td>
              <td>
                {editandoId === usuario.id ? (
                  <>
                    <button 
                      onClick={() => actualizarRol(usuario.id, rolTemporal)}
                      className="btn-guardar"
                    >
                      Guardar
                    </button>
                    <button 
                      onClick={() => setEditandoId(null)}
                      className="btn-cancelar"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setEditandoId(usuario.id);
                        setRolTemporal(usuario.rol);
                      }}
                      className="btn-editar"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarUsuario(usuario.id)}
                      className="btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="total-usuarios">
        Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
      </p>
    </div>
  );
}