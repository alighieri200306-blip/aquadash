import "./styles/tokens.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: cualquiera puede ver el Login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida: solo usuarios autenticados pueden ver el Inicio */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Inicio />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;