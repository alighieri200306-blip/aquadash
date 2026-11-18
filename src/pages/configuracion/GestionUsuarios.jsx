import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [editandoId, setEditandoId] = useState(null);
  const [rolTemporal, setRolTemporal] = useState("");
  const [miRol, setMiRol] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "Visitante",
    estado: "activo",
    notificaciones: true,
  });

  async function cargarMiRol() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setMiRol(null);
        return;
      }

      const { data: miPerfil, error } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setMiRol(miPerfil?.rol || null);
    } catch (err) {
      console.error("Error al cargar mi rol:", err);
    }
  }

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

  useEffect(() => {
    async function iniciar() {
      await cargarMiRol();
      await cargarUsuarios();
    }
    iniciar();
  }, []);

  async function actualizarRol(id, nuevoRol) {
    if (miRol !== "Administrador") {
      alert("Solo los Administradores pueden cambiar roles.");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ rol: nuevoRol })
        .eq("id", id);
      if (error) throw error;
      setUsuarios(
        usuarios.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u)),
      );
      setEditandoId(null);
    } catch (err) {
      console.error("Error al actualizar rol:", err);
      setError(err.message);
    }
  }

  async function actualizarEstado(id, nuevoEstado) {
    if (miRol !== "Administrador") {
      alert("Solo los Administradores pueden cambiar estados.");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ estado: nuevoEstado })
        .eq("id", id);
      if (error) throw error;
      setUsuarios(
        usuarios.map((u) => (u.id === id ? { ...u, estado: nuevoEstado } : u)),
      );
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setError(err.message);
    }
  }

  // ✅ ÚNICO CAMBIO: versión simple que ya funcionaba (delete directo en profiles)
  async function eliminarUsuario(id) {
    if (miRol !== "Administrador") {
      alert("Solo los Administradores pueden eliminar usuarios.");
      return;
    }
    if (!confirm("¿Estás seguro? Se eliminará al usuario de forma permanente."))
      return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setUsuarios(usuarios.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      setError(err.message);
    }
  }

  async function handleCrearUsuario(e) {
    e.preventDefault();
    if (miRol !== "Administrador") {
      alert("Solo los Administradores pueden crear usuarios.");
      return;
    }

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { nombre: formData.nombre, rol: formData.rol },
        },
      });

      if (authError) throw authError;

      // 2. Actualizar el rol en profiles (el trigger ya creó el perfil con rol Visitante)
      if (authData.user) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            nombre: formData.nombre,
            rol: formData.rol,
            estado: formData.estado,
            notificaciones: formData.notificaciones,
          })
          .eq("id", authData.user.id);

        if (updateError) throw updateError;
      }

      // 3. Resetear formulario y recargar
      setFormData({
        nombre: "",
        email: "",
        password: "",
        rol: "Visitante",
        estado: "activo",
        notificaciones: true,
      });
      setMostrarFormulario(false);
      await cargarUsuarios();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      setError(err.message);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtro === "todos") return true;
    if (filtro === "activos") return u.estado === "activo";
    if (filtro === "inactivos") return u.estado === "inactivo";
    if (filtro === "administradores") return u.rol === "Administrador";
    if (filtro === "operadores") return u.rol === "Operador";
    if (filtro === "visitantes") return u.rol === "Visitante";
    return true;
  });

  const esAdmin = miRol === "Administrador";

  if (cargando)
    return (
      <div className="gestion-usuarios">
        <p>Cargando usuarios...</p>
      </div>
    );
  if (error)
    return (
      <div className="gestion-usuarios">
        <p className="mensaje-error">Error: {error}</p>
      </div>
    );

  return (
    <div className="gestion-usuarios">
      {/* Sección: Información de los Usuarios */}
      <section className="seccion-info">
        <h2>Información de los Usuarios</h2>
        <p className="subtitulo-seccion">
          Datos generales de los usuarios dentro del sistema
        </p>
      </section>

      {/* Sección: Usuarios con Acceso */}
      <section className="seccion-usuarios">
        <h3>Usuarios con Acceso</h3>
        <p className="descripcion-seccion">
          Gestiona quién puede visualizar métricas, alterar setpoints o accionar
          actuadores
        </p>

        <div className="controles-usuarios">
          <div className="filtro-container">
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

          {esAdmin && (
            <button
              className="btn-agregar"
              onClick={() => setMostrarFormulario(true)}
            >
              + Agregar usuario
            </button>
          )}
        </div>

        {/* Formulario de alta */}
        {mostrarFormulario && esAdmin && (
          <form className="formulario-alta" onSubmit={handleCrearUsuario}>
            <h4>Nuevo Usuario</h4>
            <div className="grid-form">
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Contraseña (mínimo 8 caracteres)"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                minLength={8}
                required
              />
              <select
                value={formData.rol}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
              >
                <option value="Visitante">Visitante</option>
                <option value="Operador">Operador</option>
                <option value="Administrador">Administrador</option>
              </select>
              <select
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-guardar">
                Crear usuario
              </button>
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Tabla de usuarios */}
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>USUARIO</th>
              <th>ROL</th>
              <th>ESTADO</th>
              <th>NOTIFICACIONES</th>
              {esAdmin && <th>ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nombre || "Sin nombre"}</td>
                <td>
                  {esAdmin && editandoId === usuario.id ? (
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
                    <span
                      className={`badge badge-${usuario.rol.toLowerCase()}`}
                    >
                      {usuario.rol}
                    </span>
                  )}
                </td>
                <td>
                  {esAdmin ? (
                    <label className="toggle-estado">
                      <input
                        type="checkbox"
                        checked={usuario.estado === "activo"}
                        onChange={(e) =>
                          actualizarEstado(
                            usuario.id,
                            e.target.checked ? "activo" : "inactivo",
                          )
                        }
                      />
                      <span className={`badge badge-${usuario.estado}`}>
                        {usuario.estado}
                      </span>
                    </label>
                  ) : (
                    <span className={`badge badge-${usuario.estado}`}>
                      {usuario.estado}
                    </span>
                  )}
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={usuario.notificaciones}
                    disabled={!esAdmin}
                    onChange={async (e) => {
                      if (!esAdmin) return;
                      const { error } = await supabase
                        .from("profiles")
                        .update({ notificaciones: e.target.checked })
                        .eq("id", usuario.id);
                      if (!error) {
                        setUsuarios(
                          usuarios.map((u) =>
                            u.id === usuario.id
                              ? { ...u, notificaciones: e.target.checked }
                              : u,
                          ),
                        );
                      }
                    }}
                  />
                </td>
                {esAdmin && (
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
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminarUsuario(usuario.id)}
                          className="btn-eliminar"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="total-usuarios">
          Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
        </p>
      </section>

      {/* Sección: Permisos y Roles - Matriz */}
      <section className="seccion-matriz">
        <h3>Permisos y Roles</h3>
        <p className="descripcion-seccion">Matriz de Roles por usuarios</p>

        <table className="tabla-matriz">
          <thead>
            <tr>
              <th>MÓDULO</th>
              <th>ADMINISTRADOR</th>
              <th>OPERADOR</th>
              <th>VISITANTE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ver Dashboard (Inicio)</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>Ver Histórico</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>Gestionar Usuarios</td>
              <td>✅</td>
              <td>❌</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Gestionar Sensores</td>
              <td>✅</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Accionar Actuadores</td>
              <td>✅</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Reconocer Alertas</td>
              <td>✅</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Configuración General</td>
              <td>✅</td>
              <td>❌</td>
              <td>❌</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Sección: Ajuste de notificaciones */}
      <section className="seccion-notificaciones">
        <h3>Ajuste de notificaciones</h3>
        <p className="descripcion-seccion">
          Configura las preferencias de notificaciones por rol
        </p>

        <div className="opciones-notificaciones">
          <label className="opcion-notif">
            <input type="checkbox" defaultChecked />
            <span>Alertas críticas (nivel de agua, pH, temperatura)</span>
          </label>
          <label className="opcion-notif">
            <input type="checkbox" defaultChecked />
            <span>Mantenimiento programado</span>
          </label>
          <label className="opcion-notif">
            <input type="checkbox" defaultChecked />
            <span>Reportes semanales</span>
          </label>
          <label className="opcion-notif">
            <input type="checkbox" />
            <span>Notificaciones de nuevos usuarios registrados</span>
          </label>
        </div>
      </section>

      {/* Footer con última actualización */}
      <footer className="footer-config">
        <p>Última actualización: {new Date().toLocaleString("es-MX")}</p>
      </footer>
    </div>
  );
}