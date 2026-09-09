import { useState, useRef } from "react";
import "../styles/pages/registroTallerCodigo.css";

const RegisterTallerCodigo = () => {
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const valor = e.target.value;

    // Solo números
    if (!/^\d*$/.test(valor)) return;

    const nuevoCodigo = [...codigo];
    nuevoCodigo[index] = valor;
    setCodigo(nuevoCodigo);

    // Pasar al siguiente input
    if (valor && index < codigo.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (
      !(
        (e.key >= "0" && e.key <= "9") ||
        e.key === "Backspace" ||
        e.key === "Tab" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      )
    ) {
      e.preventDefault();
    }

    // Volver al anterior al borrar
    if (e.key === "Backspace" && codigo[index] === "" && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const textoPegado = e.clipboardData
      .getData("text")
      .trim()
      .replace(/\D/g, "");

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

  return (
    <div id="containerRegistroTallerCodigo">
      <h1>¡Un último paso para abrir tu taller!</h1>

      <img id="imgcodigo" src="correo.png" alt="" />
      <div id="descodigo">
        <h2>Verifica tu correo electrónico</h2>
        <p>
          Te hemos enviado un código
        </p>
      </div>

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

      <button id="verificarcodigo">Verificar código</button>

      <div id="recibisteCodigo">
        <p>¿No recibiste el código?</p>

        <button>Reenviar código</button>
      </div>
    </div>
  );
};

export default RegisterTallerCodigo;
