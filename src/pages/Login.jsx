import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [terminos, setTerminos] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [codigoAdmin, setCodigoAdmin] = useState("");

  // Validaciones
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const regexTelefono = /^[0-9]{10}$/;

  const reglasContraseña = [
    { texto: "Mínimo 8 caracteres", prueba: (valor) => valor.length >= 8 },
    {
      texto: "Al menos una letra mayúscula",
      prueba: (valor) => /[A-Z]/.test(valor),
    },
    {
      texto: "Al menos una letra minúscula",
      prueba: (valor) => /[a-z]/.test(valor),
    },
    { texto: "Al menos un número", prueba: (valor) => /[0-9]/.test(valor) },
  ];

  const [requisitosCumplidos, setRequisitosCumplidos] = useState(
    reglasContraseña.map(() => false),
  );

  function actualizarRequisitos(valor) {
    const nuevosRequisitos = reglasContraseña.map((regla) =>
      regla.prueba(valor),
    );
    setRequisitosCumplidos(nuevosRequisitos);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    if (esRegistro) {
      // Validaciones de registro
      if (nombre.length < 3) {
        setError("El nombre debe tener al menos 3 caracteres.");
        return;
      }
      if (!regexCorreo.test(email)) {
        setError("Correo inválido.");
        return;
      }
      if (!requisitosCumplidos.every(Boolean)) {
        setError("La contraseña no cumple los requisitos.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      if (!regexTelefono.test(telefono)) {
        setError("Teléfono inválido (10 dígitos).");
        return;
      }
      if (!terminos) {
        setError("Debes aceptar los términos y condiciones.");
        return;
      }

      // Determinar el rol según el código de administrador
      const CODIGO_ADMIN_SECRETO = "AQUADASH2026"; // Cambia este código por el que quieras
      const rolAsignado =
        codigoAdmin === CODIGO_ADMIN_SECRETO ? "Administrador" : "Visitante";

      // Registro en Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre,
            telefono: telefono,
            fecha_nacimiento: fechaNac,
            rol: rolAsignado, // ← Esto es lo nuevo
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMensaje(
          `Cuenta creada con rol: ${rolAsignado}. Ya puedes iniciar sesión.`,
        );
        console.log(
          "Usuario registrado:",
          data.user,
          "Rol asignado:",
          rolAsignado,
        );

        // Limpiar formulario
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setNombre("");
        setTelefono("");
        setFechaNac("");
        setCodigoAdmin(""); // ← Limpiar el código también
        setTerminos(false);
        setEsRegistro(false);
      }
    } else {
      // Inicio de sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setMensaje("Login exitoso. Redirigiendo...");
        console.log("Usuario autenticado:", data.user);
        // Aquí redirigiremos al Inicio después
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    }
  }

  return (
    <div className="login-container">
      <header>
        <h1>{esRegistro ? "Crear cuenta" : "Iniciar Sesión"} - AquaDash</h1>
        <p>
          {esRegistro
            ? "Completa todos los campos para registrarte."
            : "Ingresa tus credenciales"}
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>
            {esRegistro ? "Datos para el registro" : "Credenciales"}
          </legend>

          {esRegistro && (
            <div className="campo">
              <label htmlFor="nombre">Nombre completo:</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                minLength={3}
              />
            </div>
          )}

          <div className="campo">
            <label htmlFor="email">Correo electrónico:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña:</label>
            <div className="input-con-boton">
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  actualizarRequisitos(e.target.value);
                }}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {esRegistro && (
            <>
              <div className="campo">
                <label>Requisitos de contraseña:</label>
                <ul className="lista-requisitos">
                  {reglasContraseña.map((regla, index) => (
                    <li
                      key={index}
                      className={requisitosCumplidos[index] ? "cumplida" : ""}
                    >
                      {regla.texto}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="campo">
                <label htmlFor="confirmPassword">Confirma la contraseña:</label>
                <input
                  id="confirmPassword"
                  type={mostrarPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="campo">
                <label htmlFor="telefono">
                  Número telefónico (10 dígitos):
                </label>
                <input
                  id="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  pattern="[0-9]{10}"
                  autoComplete="off"
                />
              </div>

              <div className="campo">
                <label htmlFor="fechaNac">Fecha de nacimiento:</label>
                <input
                  id="fechaNac"
                  type="date"
                  value={fechaNac}
                  onChange={(e) => setFechaNac(e.target.value)}
                  required
                  min="1920-01-01"
                  max="2010-12-31"
                  autoComplete="off"
                />
              </div>
              <div className="campo">
                <label htmlFor="codigoAdmin">
                  Código de administrador (opcional):
                </label>
                <input
                  id="codigoAdmin"
                  type="password"
                  value={codigoAdmin}
                  onChange={(e) => setCodigoAdmin(e.target.value)}
                  placeholder="Déjalo vacío si no eres administrador"
                />
              </div>
            </>
          )}

          {esRegistro && (
            <div className="terminos-container">
              <input
                id="terminos"
                type="checkbox"
                checked={terminos}
                onChange={(e) => setTerminos(e.target.checked)}
                required
              />
              <label htmlFor="terminos">
                Acepto los términos y condiciones
              </label>
            </div>
          )}
        </fieldset>

        {error && <p className="mensaje-error">{error}</p>}
        {mensaje && <p className="mensaje-exito">{mensaje}</p>}

        <button type="submit">{esRegistro ? "Registrarme" : "Entrar"}</button>
      </form>

      <button
        className="btn-secundario btn-cambiar-modo"
        onClick={() => {
          setEsRegistro(!esRegistro);
          setMensaje(null);
          setError(null);
        }}
      >
        {esRegistro
          ? "¿Ya tienes cuenta? Inicia sesión"
          : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
}
