import "../../../styles/components/layout/auth/login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!emailRegex.test(formData.email)) {
      alert("Ingrese un correo electrónico válido.");
      return;
    }

    if (formData.password.trim() === "") {
      alert("Ingrese la contraseña.");
      return;
    }

    // Si todo está correcto, recién ahí cambia de página
    navigate("/home"); // Cambiá "/home" por la ruta que corresponda
  };

  return (
    <div id="containerLogin">
      <div id="ladoIzquierdoLogin">

        <img
          className="logoMobileLogin"
          src="/logoblanco.png"
          alt="Logo SMT"
        />

        <h1>Iniciar sesion</h1>

        <div className="form-containerLogin">
          <div className="form-gridLogin">

            <div className="input-groupLogin">
              <label>Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-groupLogin">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        <button
          id="loginIniciarSesion"
          onClick={handleSubmit}
        >
          Iniciar Sesión
        </button>

        <p>
          ¿No tienes una cuenta? <Link to="/inicio">Registrate</Link>
        </p>

      </div>

      <div id="ladoDerechoLogin">
        <img src="/logoblanco.png" alt="Imagen decorativa" />
      </div>
    </div>
  );
};

export default Login;