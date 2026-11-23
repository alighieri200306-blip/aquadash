import "./styles/tokens.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Configuracion from "./pages/Configuracion";
import SkipLink from "./components/SkipLink";
import Historico from "./pages/Historico";

// Componente temporal para rutas en construcción
function Proximamente({ nombre }) {
  return (
    <div>
      <Navbar />
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <h1>{nombre}</h1>
        <p style={{ color: "#7f8c8d", fontSize: "18px" }}>
          Esta vista estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Inicio />
            </PrivateRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <PrivateRoute>
              <Configuracion />
            </PrivateRoute>
          }
        />
        <Route
          path="/historico"
          element={
            <PrivateRoute>
              <Historico />
            </PrivateRoute>
          }
        />
        <Route
          path="/mantenimiento"
          element={
            <PrivateRoute>
              <Proximamente nombre="Mantenimiento" />
            </PrivateRoute>
          }
        />
        <Route
          path="/alertas"
          element={
            <PrivateRoute>
              <Proximamente nombre="Alertas" />
            </PrivateRoute>
          }
        />
        <Route
          path="/grabaciones"
          element={
            <PrivateRoute>
              <Proximamente nombre="Grabaciones" />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
