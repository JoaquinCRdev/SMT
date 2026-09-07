import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/planes.css";

const Planes = () => {
  const [planSeleccionado, setPlanSeleccionado] = useState("");
  const navigate = useNavigate();

  return (
    <div id="nuevo">
      <div id="containerPlanes">
        <img id="smtpro" src="/smtpro.png" alt="Planes" />
        <p id="accede">Accede a todas las funcionalidades</p>

        <div id="containerfuncionalidades">
          <div className="funcionalidades">
            <img className="iconos" src="/iconosinanuncios.png" alt="" />
            <h1>Sin anuncios</h1>
            <p>0 distracciones, más enfoque.</p>
          </div>

          <div className="funcionalidades">
            <img className="iconos" src="/iconoilimitado.png" alt="" />
            <h1>Máquinas ilimitadas</h1>
            <p>Conecta todas las máquinas que necesites.</p>
          </div>

          <div className="funcionalidades">
            <img className="iconos" src="/iconopersonal.png" alt="" />
            <h1>Agregar personal</h1>
            <p>Invita de 0 a 10 colaboradores a tu cuenta.</p>
          </div>

          <div className="funcionalidades">
            <img className="iconos" src="/iconoia.png" alt="" />
            <h1>Asistente IA</h1>
            <p>Un asistente inteligente que te acompaña en tu taller.</p>
          </div>

          <div className="funcionalidades">
            <img className="iconos" src="/iconohistorial.png" alt="" />
            <h1>Historial eterno</h1>
            <p>Todo registrado, nunca se borrará.</p>
          </div>

          <div className="funcionalidades">
            <img className="iconos" src="/icononave.png" alt="" />
            <h1>Gestión sin límites</h1>
            <p>Una plataforma pensada para acompañar tu crecimiento.</p>
          </div>
        </div>

        <div id="planes">
          <div
            className={`plan ${
              planSeleccionado === "mensual" ? "seleccionado" : ""
            }`}
            onClick={() => setPlanSeleccionado("mensual")}
          >
            <h1>Mensual</h1>
            <p>$9.99</p>
            <p>Pago mensual</p>
          </div>

          <div
            className={`plan ${
              planSeleccionado === "anual" ? "seleccionado" : ""
            }`}
            onClick={() => setPlanSeleccionado("anual")}
          >
            <h1>Anual</h1>
            <p>$59.99</p>
            <p>Pago anual</p>
          </div>

          <div
            className={`plan ${
              planSeleccionado === "permanente" ? "seleccionado" : ""
            }`}
            onClick={() => setPlanSeleccionado("permanente")}
          >
            <h1>Permanente</h1>
            <p>$199.99</p>
            <p>Pago único</p>
          </div>
        </div>

        <button
          id="botoncomprar"
          disabled={!planSeleccionado}
          onClick={() => {
            if (!planSeleccionado) return;

            alert(`Elegiste el plan ${planSeleccionado}`);
          }}
        >
          Comprar ahora
        </button>

        <p id="pago">Pago seguro y protegido</p>
      </div>
    </div>
  );
};

export default Planes;
