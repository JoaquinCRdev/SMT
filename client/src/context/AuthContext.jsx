import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const { data } = await api.get("/profile");
      setUser(data);
      return data;
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // La carga del perfil se dispara dentro de una IIFE asíncrona: llamarla
    // directo en el cuerpo del effect dispara el error de
    // setState síncrono dentro de un effect (cascada de renders).
    let cancelado = false;

    (async () => {
      await fetchProfile();
      if (cancelado) return;
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // si falla igual limpiamos el estado local
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refetchProfile: fetchProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};