import "./styles/tokens.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Configuracion from "./pages/Configuracion";
import Historico from "./pages/Historico";
import Mantenimiento from "./pages/Mantenimiento";
import Alertas from "./pages/Alertas";
import Grabaciones from "./pages/Grabaciones";

function App() {
  return (
    <BrowserRouter>
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
              <Mantenimiento />
            </PrivateRoute>
          }
        />
        <Route
          path="/alertas"
          element={
            <PrivateRoute>
              <Alertas />
            </PrivateRoute>
          }
        />
        <Route
          path="/grabaciones"
          element={
            <PrivateRoute>
              <Grabaciones />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;