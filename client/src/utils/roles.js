// El backend sólo tiene dos roles: user y admin. Antes se usaban roles de
// employado (Mecánico, Recepcionista, Técnico) que no existen en el modelo y
// mostraban texto inventado.
export const ETIQUETA_ROL = {
  admin: "Administrador",
  user: "Colaborador",
};

export const etiquetaRol = (role) => ETIQUETA_ROL[role] ?? "Colaborador";
