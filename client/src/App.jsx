import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WorkshopProvider } from "./context/WorkshopContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Auth from "./pages/Auth";
import RegistrarTaller from "./pages/RegistrarTaller";
import AsociarseTaller from "./pages/AsociarseTaller";
import VerificarCodigoTaller from "./pages/VerificarCodigoTaller";

import Planes from "./pages/planes";
import Mismaquinas from "./pages/mismaquinas";
import Home from "./pages/home";
import Mantenimiento from "./pages/mantenimiento";
import Configuracion from "./pages/configuracion";
import Historial from "./pages/historial";
import Ayuda from "./pages/ayuda";
import Notificaciones from "./pages/notificaciones";

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