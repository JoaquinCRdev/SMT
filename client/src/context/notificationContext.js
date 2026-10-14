import { createContext, useContext } from "react";

// Contexto y hook en un .js sin componentes: exportar el provider y el hook
// desde el mismo archivo es lo que dispara react-refresh/only-export-components
// (los 2 errores de lint que arrastra AuthContext/WorkshopContext).
export const NotificationContext = createContext({
  unread: 0,
  refrescarConteo: () => {},
});

export const useNotificationBadge = () => useContext(NotificationContext);