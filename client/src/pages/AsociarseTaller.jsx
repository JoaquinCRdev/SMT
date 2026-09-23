import "../styles/pages/asociarseTaller.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const AsociarseTaller = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Ingresá un código de taller");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/workshops/join", { code });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReintentar = () => {
    setSent(false);
    setCode("");
    setError("");
  };

  return (
    <div id="contenedorAsociarseTaller">
      <div id="cardAsociarseTaller">
        {!sent && (
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

        {sent && (
          <>
            <h1>Solicitud enviada</h1>

            <div id="estadoAsociarseTaller">
              <div className="badgeEstadoAsociarseTaller badge-pending">
                Pendiente
              </div>

              <p id="mensajeAsociarseTaller">
                Tu solicitud está siendo revisada por el administrador del
                taller. Cuando la apruebe, te va a compartir un código de 6
                caracteres para completar tu ingreso.
              </p>

              <Link to="/verificarCodigoTaller" id="linkVerificarCodigo">
                Ya tengo mi código
              </Link>

              <button onClick={handleReintentar}>
                Enviar otra solicitud
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AsociarseTaller;