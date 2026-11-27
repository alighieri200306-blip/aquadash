import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";

export default function Grabaciones() {
  const [grabaciones, setGrabaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroCamara, setFiltroCamara] = useState("todas");
  const [mostrarFormSubir, setMostrarFormSubir] = useState(false);
  const [miRol, setMiRol] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    camara: "pecera",
  });
  const [archivoVideo, setArchivoVideo] = useState(null);

  const cargarMiRol = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data: perfil } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", session.user.id)
        .single();
      setMiRol(perfil?.rol || null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const cargarGrabaciones = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setGrabaciones(data || []);
    } catch (err) {
      console.error("Error al cargar grabaciones:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    async function iniciar() {
      await cargarMiRol();
      await cargarGrabaciones();
    }
    iniciar();
  }, [cargarMiRol, cargarGrabaciones]);

  async function handleSubirVideo(e) {
    e.preventDefault();
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden subir videos.");
      return;
    }
    if (!archivoVideo) {
      alert("Selecciona un archivo de video.");
      return;
    }

    setSubiendo(true);

    try {
      // 1. Generar nombre único del archivo
      const extension = archivoVideo.name.split(".").pop();
      const nombreArchivo = `${Date.now()}_${formData.camara}.${extension}`;
      const rutaStorage = `${formData.camara}/${nombreArchivo}`;

      // 2. Subir al bucket "grabaciones"
      const { error: uploadError } = await supabase.storage
        .from("grabaciones")
        .upload(rutaStorage, archivoVideo, {
          cacheControl: "3600",
          upsert: false,
          contentType: archivoVideo.type,
        });

      if (uploadError) throw uploadError;

      // 3. Obtener URL pública del video
      const { data: urlData } = supabase.storage
        .from("grabaciones")
        .getPublicUrl(rutaStorage);

      // 4. Insertar registro en la tabla
      const { data: { session } } = await supabase.auth.getSession();
      const { data: perfil } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", session.user.id)
        .single();

      const { error: insertError } = await supabase
        .from("recordings")
        .insert([{
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          camara: formData.camara,
          url_video: urlData.publicUrl,
          tamano_mb: (archivoVideo.size / (1024 * 1024)).toFixed(2),
          subido_por: perfil?.nombre || "Admin",
        }]);

      if (insertError) throw insertError;

      // 5. Resetear y recargar
      setFormData({ titulo: "", descripcion: "", camara: "pecera" });
      setArchivoVideo(null);
      setMostrarFormSubir(false);
      await cargarGrabaciones();
      alert("✅ Video subido correctamente");
    } catch (err) {
      console.error("Error al subir video:", err);
      alert("❌ Error: " + err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(id, urlVideo) {
    if (miRol !== "Administrador") {
      alert("Solo Administradores pueden eliminar grabaciones.");
      return;
    }
    if (!confirm("¿Eliminar esta grabación? También se borrará el archivo del storage.")) return;
    try {
      // 1. Eliminar de storage
      const rutaStorage = urlVideo.split("/grabaciones/")[1];
      if (rutaStorage) {
        await supabase.storage.from("grabaciones").remove([rutaStorage]);
      }

      // 2. Eliminar de la tabla
      const { error } = await supabase
        .from("recordings")
        .delete()
        .eq("id", id);
      if (error) throw error;

      await cargarGrabaciones();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError(err.message);
    }
  }

  const grabacionesFiltradas = useMemo(() => {
    if (filtroCamara === "todas") return grabaciones;
    return grabaciones.filter((g) => g.camara === filtroCamara);
  }, [grabaciones, filtroCamara]);

  const totalPecera = grabaciones.filter((g) => g.camara === "pecera").length;
  const totalPlantas = grabaciones.filter((g) => g.camara === "plantas").length;

  const esAdmin = miRol === "Administrador";

  if (cargando)
    return (
      <div>
        <Navbar />
        <div className="grabaciones-container">
          <p>Cargando grabaciones...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div>
        <Navbar />
        <div className="grabaciones-container">
          <p className="mensaje-error">Error: {error}</p>
        </div>
      </div>
    );

  return (
    <div>
      <Navbar />
      <div className="grabaciones-container">
        <header className="grabaciones-header">
          <h1>Grabaciones</h1>
          <p className="subtitulo">
            Registro en video del sistema acuapónico: pecera y zona de plantas
          </p>
        </header>

        {/* SECCIÓN 1: En Vivo (placeholder para futuro streaming) */}
        <section className="seccion-en-vivo" aria-label="Transmisión en vivo">
          <div className="en-vivo-header">
            <h2>🔴 Transmisión en Vivo</h2>
            <span className="badge-proximamente">Próximamente</span>
          </div>
          <p className="descripcion-seccion">
            Streaming en tiempo real desde las cámaras IP conectadas a la Raspberry Pi
          </p>
          <div className="grid-en-vivo">
            <div className="camara-en-vivo">
              <div className="video-placeholder">
                <span className="icono-grande">📹</span>
                <p>CAM-01 · Pecera</p>
                <span className="estado-offline">Señal no disponible</span>
              </div>
            </div>
            <div className="camara-en-vivo">
              <div className="video-placeholder">
                <span className="icono-grande">📹</span>
                <p>CAM-02 · Zona de Plantas</p>
                <span className="estado-offline">Señal no disponible</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: Galería de grabaciones subidas */}
        <section className="seccion-galeria" aria-label="Galería de grabaciones">
          <div className="galeria-header">
            <div>
              <h2>📼 Grabaciones Guardadas</h2>
              <p className="descripcion-seccion">
                {grabacionesFiltradas.length} grabaciones disponibles
              </p>
            </div>
            <div className="galeria-controles">
              <div className="filtro-camara">
                <label htmlFor="filtro-camara">Cámara:</label>
                <select
                  id="filtro-camara"
                  value={filtroCamara}
                  onChange={(e) => setFiltroCamara(e.target.value)}
                >
                  <option value="todas">Todas ({grabaciones.length})</option>
                  <option value="pecera">🐟 Pecera ({totalPecera})</option>
                  <option value="plantas">🌿 Plantas ({totalPlantas})</option>
                </select>
              </div>
              {esAdmin && (
                <button
                  className="btn-subir"
                  onClick={() => setMostrarFormSubir(true)}
                >
                  ⬆️ Subir video
                </button>
              )}
            </div>
          </div>

          {/* Formulario de subida */}
          {mostrarFormSubir && esAdmin && (
            <form className="formulario-subida" onSubmit={handleSubirVideo}>
              <h4>Subir nueva grabación</h4>
              <div className="grid-form">
                <div className="campo-form">
                  <label htmlFor="titulo">Título *</label>
                  <input
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                    placeholder="Ej: Alimentación matutina"
                  />
                </div>
                <div className="campo-form">
                  <label htmlFor="camara">Cámara *</label>
                  <select
                    id="camara"
                    name="camara"
                    value={formData.camara}
                    onChange={(e) => setFormData({ ...formData, camara: e.target.value })}
                  >
                    <option value="pecera">🐟 Pecera</option>
                    <option value="plantas">🌿 Zona de Plantas</option>
                  </select>
                </div>
                <div className="campo-form campo-completo">
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows="2"
                    placeholder="Qué muestra este video..."
                  ></textarea>
                </div>
                <div className="campo-form campo-completo">
                  <label htmlFor="archivo">Archivo de video *</label>
                  <input
                    id="archivo"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => setArchivoVideo(e.target.files[0])}
                    required
                    disabled={subiendo}
                  />
                  {archivoVideo && (
                    <span className="info-archivo">
                      📎 {archivoVideo.name} ({(archivoVideo.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  )}
                </div>
              </div>
              {subiendo && (
                <div className="progreso-subida" role="status" aria-live="polite">
                  Subiendo video...
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn-guardar" disabled={subiendo}>
                  {subiendo ? "Subiendo..." : "Subir video"}
                </button>
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setMostrarFormSubir(false)}
                  disabled={subiendo}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Grid de videos */}
          {grabacionesFiltradas.length === 0 ? (
            <p className="vacio">
              No hay grabaciones {filtroCamara !== "todas" ? "para esta cámara" : ""}.
              {esAdmin && " Usa el botón ⬆️ Subir video para agregar una."}
            </p>
          ) : (
            <div className="grid-videos">
              {grabacionesFiltradas.map((g) => (
                <div key={g.id} className={`video-card ${g.camara}`}>
                  <div className="video-preview">
                    <video
                      src={g.url_video}
                      controls
                      loop
                      preload="metadata"
                      className="video-player"
                      aria-label={`Video: ${g.titulo}`}
                    >
                      Tu navegador no soporta videos HTML5.
                    </video>
                    <span className={`badge-camara ${g.camara}`}>
                      {g.camara === "pecera" ? "🐟 Pecera" : "🌿 Plantas"}
                    </span>
                  </div>
                  <div className="video-info">
                    <h3>{g.titulo}</h3>
                    {g.descripcion && <p className="video-descripcion">{g.descripcion}</p>}
                    <div className="video-meta">
                      <span>📅 {new Date(g.created_at).toLocaleDateString("es-MX")}</span>
                      {g.tamano_mb && <span>💾 {g.tamano_mb} MB</span>}
                      {g.subido_por && <span>👤 {g.subido_por}</span>}
                    </div>
                  </div>
                  {esAdmin && (
                    <div className="video-acciones">
                      <button
                        onClick={() => handleEliminar(g.id, g.url_video)}
                        className="btn-eliminar-video"
                        aria-label={`Eliminar video ${g.titulo}`}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="footer-config">
          <p>Última actualización: {new Date().toLocaleString("es-MX")}</p>
        </footer>
      </div>
    </div>
  );
}