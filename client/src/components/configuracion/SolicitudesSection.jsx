import { useEffect, useState } from "react";
import i18n from "../../i18n/i18n";
import api from "../../api/axios";

const SolicitudesSection = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(null);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/workshops/requests");
      setSolicitudes(data);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const resolver = async (requestId, status) => {
    try {
      await api.patch(`/workshops/requests/${requestId}`, { status });
      await fetchSolicitudes();
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo procesar la solicitud");
    }
  };

  const cancelar = async (requestId) => {
    try {
      await api.patch(`/workshops/requests/${requestId}/cancel`);
      await fetchSolicitudes();
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo cancelar la solicitud");
    }
  };

  const copiarCodigo = async (requestId, code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiado(requestId);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // silencioso
    }
  };

  return (
    <section className="section-card">
      <div className="section-header" id="solicitudesHeader">
        <div>
          <h2 className="section-title">{i18n.t("pages.configuracion.configs.solicitudes.h2")}</h2>
          <p className="section-subtitle">{i18n.t("pages.configuracion.configs.solicitudes.p")}</p>
        </div>

        <button type="button" id="btnRefreshSolicitudes" onClick={fetchSolicitudes} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {loading ? (
        <p>Cargando solicitudes...</p>
      ) : solicitudes.length === 0 ? (
        <p id="sinSolicitudes">No hay solicitudes pendientes</p>
      ) : (
        <div className="requests-list">
          {solicitudes.map((req) => (
            <div key={req._id} className="request-item">
              <div className="request-user">
                <div className="staff-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="request-text">
                  <span className="request-name">{req.user?.name}</span>
                  <span className="request-action-text">
                    {req.status === "pending"
                      ? i18n.t("pages.configuracion.configs.solicitudes.solicitud.span")
                      : "Esperando que complete su ingreso"}
                  </span>
                </div>
              </div>

              {req.status === "pending" && (
                <div className="request-buttons">
                  <button className="btn-accept" onClick={() => resolver(req._id, "approved")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 11 12 14 22 4" />
                    </svg>
                    {i18n.t("pages.configuracion.configs.solicitudes.solicitud.aceptar")}
                  </button>
                  <button className="btn-reject" onClick={() => resolver(req._id, "rejected")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {i18n.t("pages.configuracion.configs.solicitudes.solicitud.rechazar")}
                  </button>
                </div>
              )}

              {req.status === "approved" && (
                <div id="requestApprovedActions">
                  <div id="requestCodeBox">
                    <span id="requestCodeValue">{req.code}</span>
                    <button
                      type="button"
                      id="requestCodeCopyBtn"
                      onClick={() => copiarCodigo(req._id, req.code)}
                    >
                      {copiado === req._id ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <button className="btn-reject" onClick={() => cancelar(req._id)}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SolicitudesSection;