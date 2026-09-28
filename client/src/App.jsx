import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { WorkshopProvider } from "./context/WorkshopContext";
import AsociarseTaller from "./pages/AsociarseTaller";
import Auth from "./pages/Auth";
import Ayuda from "./pages/ayuda";
import Configuracion from "./pages/configuracion";
import ElegirTaller from "./pages/ElegirTaller";
import Historial from "./pages/historial";
import Home from "./pages/home";
import Mantenimiento from "./pages/mantenimiento";
import Mismaquinas from "./pages/mismaquinas";
import Notificaciones from "./pages/notificaciones";
import Planes from "./pages/planes";
import RegistrarTaller from "./pages/registrarTaller";
import VerificarCodigoTaller from "./pages/VerificarCodigoTaller";

const App = () => {
  return (
    <AuthProvider>
      <WorkshopProvider>
        <BrowserRouter>
          <Routes>
            {/* Pública */}
            <Route path="/auth" element={<Auth />} />

            {/* Protegidas, sin exigir workshop (son para el que todavía no tiene) */}
            <Route
              path="/elegirTaller"
              element={
                <ProtectedRoute requireWorkshop={false}>
                  <ElegirTaller />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crearTaller"
              element={
                <ProtectedRoute requireWorkshop={false}>
                  <RegistrarTaller />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asociarseTaller"
              element={
                <ProtectedRoute requireWorkshop={false}>
                  <AsociarseTaller />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verificarCodigoTaller"
              element={
                <ProtectedRoute requireWorkshop={false}>
                  <VerificarCodigoTaller />
                </ProtectedRoute>
              }
            />

            {/* Protegidas, requieren workshop asignado */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mismaquinas"
              element={
                <ProtectedRoute>
                  <Mismaquinas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mantenimiento"
              element={
                <ProtectedRoute>
                  <Mantenimiento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/historial"
              element={
                <ProtectedRoute>
                  <Historial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ayuda"
              element={
                <ProtectedRoute>
                  <Ayuda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notificaciones"
              element={
                <ProtectedRoute>
                  <Notificaciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planes"
              element={
                <ProtectedRoute>
                  <Planes />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkshopProvider>
    </AuthProvider>
  );
};

export default App;
