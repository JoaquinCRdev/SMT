import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRedirectPath } from "../utils/redirectByUser";

// requireWorkshop: si es false, deja pasar aunque no tenga taller
// (para /crearTaller y /asociarseTaller, que existen justamente para el que no tiene)
const ProtectedRoute = ({ children, requireWorkshop = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireWorkshop && !user.workshop) {
    return <Navigate to={getRedirectPath(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;