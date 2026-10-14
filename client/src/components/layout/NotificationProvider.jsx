import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { NotificationContext } from "../../context/notificationContext";

// Sin polling a propósito: se pide el conteo al montar y la página de notificaciones refresca al marcar algo. Así el servidor no recibe un countDocuments por usuario cada minuto.
const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const usuarioActual = user?._id ?? null;

  // El conteo se guarda junto al usuario al que pertenece. Así el badge vuelve a 0 al desloguear o cambiar de cuenta por derivación, sin resetear estado dentro del efecto (react-hooks/set-state-in-effect).
  const [conteo, setConteo] = useState({ usuario: null, unread: 0 });

  const unread = conteo.usuario === usuarioActual ? conteo.unread : 0;

  // La usa la página de notificaciones al marcar algo, para que la campana no quede mostrando un número viejo.
  const refrescarConteo = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setConteo({ usuario: usuarioActual, unread: res.data?.unread ?? 0 });
    } catch {
      // Un 401 al cargar /auth (o al expirar el token) no debe romper la app: en el peor caso la campana queda en 0.
      setConteo({ usuario: usuarioActual, unread: 0 });
    }
  }, [usuarioActual]);

  // Sin usuario no hay token: pedir el conteo solo dispararía un 401.
  useEffect(() => {
    if (!usuarioActual) return;

    let cancelado = false;

    (async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        if (cancelado) return;
        setConteo({ usuario: usuarioActual, unread: res.data?.unread ?? 0 });
      } catch {
        if (cancelado) return;
        setConteo({ usuario: usuarioActual, unread: 0 });
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [usuarioActual]);

  return (
    <NotificationContext.Provider value={{ unread, refrescarConteo }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
