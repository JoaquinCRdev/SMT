import { useState } from "react";

const CodigoTallerCard = ({ code }) => {
  const [copiado, setCopiado] = useState(false);

  if (!code) return null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // silencioso
    }
  };

  return (
    <section className="section-card">
      <div className="section-header">
        <h2 className="section-title">Código del taller</h2>
        <p className="section-subtitle">
          Compartí este código con quien quiera solicitar unirse a tu taller
        </p>
      </div>

      <div id="workshopCodeBox">
        <span id="workshopCodeValue">{code}</span>
        <button type="button" id="workshopCodeCopyBtn" onClick={copiar}>
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </section>
  );
};

export default CodigoTallerCard;