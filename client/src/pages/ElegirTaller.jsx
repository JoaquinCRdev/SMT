import "../styles/pages/elegirTaller.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import useApplyTheme from "../hooks/useApplyTheme";

// Pantalla a la que cae un usuario que todavía no pertenece a ningún taller.
// Es la primera parada después de iniciar sesión, así que tiene tres estados:
//
//   - sin solicitud: elegir entre crear o unirse a un taller.
//   - solicitud pendiente: ya pidió unirse, no tiene sentido ofrecerle crear
//     otro taller ni pedir de nuevo (el server lo rechazaría con 409).
//   - solicitud aprobada: tiene que confirmar con el código, así que se lo
//     manda directo a /verificarCodigoTaller.
//
// Y en los tres casos hay que poder salir: antes esta pantalla era un callejón
// sin salida (sin cerrar sesión ni forma de volver), así que un usuario que ya
// tenía cuenta quedaba atrapado acá sin poder entrar con otra.

const opciones = [
  { to: "/crearTaller", clave: "crear" },
  { to: "/asociarseTaller", clave: "unirse" },
];

const ElegirTaller = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Esta pantalla vive fuera del layout con sidebar, así que nadie le aplica el
  // tema guardado (modo oscuro/claro y tamaño de fuente): lo hace ella misma,
  // igual que registrarTaller, VerificarCodigoTaller y AsociarseTaller.
  useApplyTheme();

  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    // IIFE: setStatear después del await evita el error de setState síncrono
    // dentro de un effect (mismo patrón que AuthContext y SolicitudesSection).
    (async () => {
      try {
        const { data } = await api.get("/workshops/requests/mine");
        if (cancelado) return;

        // Una solicitud rechazada o completada ya no está viva: se trata como
        // "sin solicitud" y el usuario puede volver a elegir.
        if (data && (data.status === "pending" || data.status === "approved")) {
          setSolicitud(data);
        } else {
          setSolicitud(null);
        }
      } catch {
        // Si la consulta falla se muestran las opciones normales: no tiene
        // sentido bloquear al usuario por un error de red.
        if (!cancelado) setSolicitud(null);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    // Aprobada: el paso siguiente no es elegir, es confirmar el código.
    if (solicitud?.status === "approved") {
      navigate("/verificarCodigoTaller", { replace: true });
    }
  }, [solicitud, navigate]);

  const salir = () => logout();

  const nombre = (user?.name || "").trim().split(/\s+/)[0];

  return (
    <div id="contenedorElegirTaller">
      <div id="cardElegirTaller">
        {/* Encabezado: deja en claro que ya hay una sesión iniciada. */}
        <div id="sesionElegirTaller">
          <span id="saludoElegirTaller">
            {t("pages.elegirTaller.saludo", { nombre })}
          </span>
          <button type="button" id="cerrarSesionElegirTaller" onClick={salir}>
            {t("pages.elegirTaller.cerrar_sesion")}
          </button>
        </div>

        {cargando ? (
          <p id="subtituloElegirTaller">{t("pages.elegirTaller.cargando")}</p>
        ) : solicitud?.status === "pending" ? (
          // Pendiente: no se ofrecen crear/unirse, ya hizo lo que tenía que hacer.
          <>
            <h1>{t("pages.elegirTaller.pendiente.titulo")}</h1>
            <p id="subtituloElegirTaller">
              {t("pages.elegirTaller.pendiente.descripcion", {
                taller: solicitud.workshop?.name || "",
              })}
            </p>

            <Link to="/verificarCodigoTaller" id="linkVerificarCodigo">
              {t("pages.elegirTaller.pendiente.verificar")}
            </Link>
          </>
        ) : (
          // Sin solicitud viva: las dos opciones de siempre.
          <>
            <h1>{t("pages.elegirTaller.titulo")}</h1>
            <p id="subtituloElegirTaller">{t("pages.elegirTaller.subtitulo")}</p>

            <div id="opcionesElegirTaller">
              {opciones.map((opcion) => (
                <Link
                  key={opcion.to}
                  to={opcion.to}
                  className="opcionElegirTaller"
                  id={`opcion${opcion.to.replaceAll("/", "")}`}
                >
                  <h2>{t(`pages.elegirTaller.${opcion.clave}.titulo`)}</h2>
                  <p>{t(`pages.elegirTaller.${opcion.clave}.descripcion`)}</p>
                  <span>{t(`pages.elegirTaller.${opcion.clave}.accion`)}</span>
                </Link>
              ))}
            </div>

            <p id="otraCuentaElegirTaller">
              {t("pages.elegirTaller.otra_cuenta")}{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  salir();
                }}
              >
                {t("pages.elegirTaller.iniciar_sesion")}
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ElegirTaller;
