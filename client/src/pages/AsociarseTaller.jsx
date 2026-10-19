import "../styles/pages/asociarseTaller.css";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useApplyTheme from "../hooks/useApplyTheme";

const POLL_INTERVAL_MS = 10000;

const MENSAJES_ERROR = {
  400: "El código no tiene un formato válido",
  404: "No existe un taller con ese código",
  409: "Ya tenés una solicitud pendiente o ya pertenecés a un taller",
};

const AsociarseTaller = () => {
  useApplyTheme();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [checking, setChecking] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/workshops/requests/mine");
      setRequest(data);
    } catch (err) {
      // 404 = todavía no envió ninguna solicitud. Cualquier otro error
      // (red, timeout) no debe pisar el estado que ya se está mostrando.
      if (err.response?.status === 404) setRequest(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const status = request?.status;

  // Mientras la solicitud esté pendiente o aprobada, consulta el estado
  // cada tanto (así se entera de la aprobación o de una cancelación sin recargar).
  useEffect(() => {
    if (status !== "pending" && status !== "approved") return undefined;

    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const limpio = code.trim().toUpperCase();

    if (!limpio) {
      setError("Ingresá un código de taller");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/workshops/join", { code: limpio });
      setRequest({ status: "pending" });
      await fetchStatus();
    } catch (err) {
      setError(
        MENSAJES_ERROR[err.response?.status] || "No se pudo enviar la solicitud",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div id="contenedorAsociarseTaller">
        <div id="cardAsociarseTaller">
          <p id="mensajeAsociarseTaller">Cargando...</p>
        </div>
      </div>
    );
  }

  const mostrarFormulario =
    !request || status === "rejected" || status === "completed";

  return (
    <div id="contenedorAsociarseTaller">
      <div id="cardAsociarseTaller">
        {mostrarFormulario && (
          <>
            <Link to="/elegirTaller" id="linkVolverAsociarseTaller">
              ← Volver
            </Link>

            <h1>Asociate a un taller</h1>
            <p id="subtituloAsociarseTaller">
              Ingresá el código que te compartió el administrador del taller
            </p>

            {status === "rejected" && (
              <p id="avisoAsociarseTaller">
                Tu última solicitud fue rechazada. Podés intentar con otro
                código.
              </p>
            )}

            <form id="formAsociarseTaller" onSubmit={handleSubmit}>
              {error && <p id="errorAsociarseTaller">{error}</p>}

              <input
                type="text"
                placeholder="Código de taller"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />

              <button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Solicitar asociación"}
              </button>
            </form>
          </>
        )}

        {status === "pending" && (
          <>
            <h1>Solicitud enviada</h1>

            <div id="estadoAsociarseTaller">
              {request.workshop?.name && (
                <div id="tallerNombreAsociarseTaller">
                  <p>Taller</p>
                  <p>{request.workshop.name}</p>
                </div>
              )}

              <div className="badgeEstadoAsociarseTaller badge-pending">
                Pendiente
              </div>

              <p id="mensajeAsociarseTaller">
                Tu solicitud está siendo revisada por el administrador del
                taller. Esta pantalla se actualiza sola cada 10 segundos.
              </p>
            </div>
          </>
        )}

        {status === "approved" && (
          <>
            <h1>¡Solicitud aprobada!</h1>

            <div id="estadoAsociarseTaller">
              {request.workshop?.name && (
                <div id="tallerNombreAsociarseTaller">
                  <p>Taller</p>
                  <p>{request.workshop.name}</p>
                </div>
              )}

              <div className="badgeEstadoAsociarseTaller badge-approved">
                Aprobada
              </div>

              <p id="mensajeAsociarseTaller">
                Pedile al administrador tu código de unión de 6 caracteres y
                completá tu ingreso.
              </p>

              <Link to="/verificarCodigoTaller" id="linkVerificarCodigo">
                Ingresar código de unión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AsociarseTaller;