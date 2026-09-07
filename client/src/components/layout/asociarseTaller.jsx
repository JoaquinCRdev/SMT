import "../../styles/components/layout/asociarseTaller.css";
import { useState } from "react";

const AsociarseTaller = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // MOCK: acá simulamos el estado que después vendría del backend.
  // null = sin solicitud enviada todavía
  // { status: "pending" | "approved" | "rejected", workshopName: string }
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Ingresá un código de taller");
      return;
    }

    setSubmitting(true);

    // Simulación de envío (sin backend). Reemplazar por la llamada real después.
    setTimeout(() => {
      setStatus({
        status: "pending",
        workshopName: "Taller de prueba",
      });
      setSubmitting(false);
    }, 800);
  };

  const handleReintentar = () => {
    setStatus(null);
    setCode("");
  };

  return (
    <div id="contenedorAsociarseTaller">
      <div id="cardAsociarseTaller">
        {!status && (
          <>
            <h1>Asociate a un taller</h1>
            <p id="subtituloAsociarseTaller">
              Ingresá el código que te compartió el administrador del taller
            </p>

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

        {status && (
          <>
            <h1>Estado de tu solicitud</h1>

            <div id="estadoAsociarseTaller">
              <div id="tallerNombreAsociarseTaller">
                <p>Taller</p>
                <p>{status.workshopName}</p>
              </div>

              <div
                className={`badgeEstadoAsociarseTaller badge-${status.status}`}
              >
                {status.status === "pending" && "Pendiente"}
                {status.status === "approved" && "Aprobado"}
                {status.status === "rejected" && "Rechazado"}
              </div>

              {status.status === "pending" && (
                <p id="mensajeAsociarseTaller">
                  Tu solicitud está siendo revisada por el administrador del
                  taller.
                </p>
              )}

              {status.status === "approved" && (
                <p id="mensajeAsociarseTaller">
                  ¡Ya formás parte del taller!
                </p>
              )}

              {status.status === "rejected" && (
                <p id="mensajeAsociarseTaller">
                  Tu solicitud fue rechazada. Podés intentar con otro código.
                </p>
              )}

              {status.status !== "approved" && (
                <button onClick={handleReintentar}>
                  {status.status === "rejected"
                    ? "Intentar con otro código"
                    : "Cancelar solicitud"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AsociarseTaller;