import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/pages/verificarCodigoTaller.css";

const CODE_LENGTH = 6;
const VALID_CHAR = /^[A-HJ-NP-Z2-9]$/;

const VerificarCodigoTaller = () => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(true);
  const inputsRef = useRef([]);

  // El solicitante recupera su propio código: antes dependía de que el administrador se lo pasara por otro medio, y el panel no lo mostraba.
  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      try {
        const res = await api.get("/workshops/requests/mine");
        if (!vigente) return;

        const solicitud = res.data;

        if (!solicitud) return;

        if (solicitud.status === "approved" && solicitud.code) {
          setCodigo(solicitud.code.split("").slice(0, CODE_LENGTH));
          setAviso(
            "Ya tenés tu código. Revisalo y confirmá para completar el ingreso.",
          );
        } else if (solicitud.status === "pending") {
          setAviso("Tu solicitud está esperando la aprobación del taller.");
        } else if (solicitud.status === "completed") {
          navigate("/home", { replace: true });
        }
      } catch {
        // Si el lookup falla no bloqueamos: el usuario puede escribir a mano.
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargar();

    return () => {
      vigente = false;
    };
  }, [navigate]);

  const handleChange = (e, index) => {
    const valor = e.target.value.toUpperCase();

    if (valor && !VALID_CHAR.test(valor)) return;

    const nuevoCodigo = [...codigo];
    nuevoCodigo[index] = valor;
    setCodigo(nuevoCodigo);

    if (valor && index < codigo.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    const esCaracterValido =
      e.key.length === 1 && VALID_CHAR.test(e.key.toUpperCase());

    const esTeclaControl =
      e.key === "Backspace" ||
      e.key === "Tab" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight";

    if (!esCaracterValido && !esTeclaControl) {
      e.preventDefault();
    }

    if (e.key === "Backspace" && codigo[index] === "" && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const textoPegado = e.clipboardData
      .getData("text")
      .trim()
      .toUpperCase()
      .replace(/[^A-HJ-NP-Z2-9]/g, "");

    const nuevoCodigo = [...codigo];

    textoPegado.split("").forEach((char, i) => {
      if (i < nuevoCodigo.length) {
        nuevoCodigo[i] = char;
      }
    });

    setCodigo(nuevoCodigo);

    const ultimoIndice = Math.min(
      textoPegado.length - 1,
      nuevoCodigo.length - 1,
    );
    if (ultimoIndice >= 0) {
      inputsRef.current[ultimoIndice].focus();
    }
  };

  const handleVerificar = async () => {
    setError("");
    const codeString = codigo.join("");

    if (codeString.length !== CODE_LENGTH) {
      setError("Completá los 6 caracteres del código");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/workshops/verify-code", { code: codeString });
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Código inválido o expirado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="containerRegistroTallerCodigo">
      <h1>¡Un último paso para unirte al taller!</h1>

      <img id="imgcodigo" src="correo.png" alt="" />
      <div id="descodigo">
        <h2>Ingresá tu código de unión</h2>
        <p>Ingresá tu código de unión de 6 caracteres</p>
      </div>

      {aviso && <p id="avisoVerificarCodigo">{aviso}</p>}

      {error && <p id="errorVerificarCodigo">{error}</p>}

      {cargando ? (
        <p id="avisoVerificarCodigo">Buscando tu código...</p>
      ) : (
        <>
          <div id="containerInputsCodigo">
            {codigo.map((valor, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={valor}
                ref={(el) => (inputsRef.current[index] = el)}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
              />
            ))}
          </div>

          <button
            id="verificarcodigo"
            onClick={handleVerificar}
            disabled={submitting}
          >
            {submitting ? "Verificando..." : "Verificar código"}
          </button>
        </>
      )}
    </div>
  );
};

export default VerificarCodigoTaller;
