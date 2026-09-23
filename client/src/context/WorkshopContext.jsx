import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const WorkshopContext = createContext(null);

export const WorkshopProvider = ({ children }) => {
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkshop = useCallback(async () => {
    if (!user?.workshop) {
      setWorkshop(null);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/workshops/mine");
      setWorkshop(data);
    } catch {
      setWorkshop(null);
    } finally {
      setLoading(false);
    }
  }, [user?.workshop]);

  useEffect(() => {
    fetchWorkshop();
  }, [fetchWorkshop]);

  return (
    <WorkshopContext.Provider value={{ workshop, loading, refetchWorkshop: fetchWorkshop }}>
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) throw new Error("useWorkshop debe usarse dentro de WorkshopProvider");
  return context;
};