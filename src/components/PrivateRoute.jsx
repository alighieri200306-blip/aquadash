import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PrivateRoute({ children }) {
    const [autenticado, setAutenticado] = useState(null);

    useEffect(() => {
    // Verificar si hay una sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
    setAutenticado(!!session);
    });

    // Escuchar cambios en la autenticación
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
    setAutenticado(!!session);
    });

    // Limpiar el listener al desmontar el componente
    return () => subscription.unsubscribe();
    }, []);

  // Mientras verifica, no renderizar nada (o podrías mostrar un loader)
    if (autenticado === null) {
    return null;
    }

  // Si no está autenticado, redirigir al Login
    if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar la página protegida
  return children;
}
