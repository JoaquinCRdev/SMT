import "../../../styles/components/layout/auth/login.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { getRedirectPath } from "../../../utils/redirectByUser";

const Login = ({ onToggle }) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailRegex.test(formData.email)) {
      setError("Ingrese un correo electrónico válido.");
      return;
    }

    if (formData.password.trim() === "") {
      setError("Ingrese la contraseña.");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      navigate(getRedirectPath(data.user));
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
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
            {error && <p id="errorLogin">{error}</p>}

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
          disabled={submitting}
        >
          {submitting ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>

        <p>
          ¿No tienes una cuenta?{" "}
          
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
          >
            Registrate
          </a>
        </p>
      </div>

      <div id="ladoDerechoLogin">
        <img src="/logoblanco.png" alt="Imagen decorativa" />
      </div>
    </div>
  );
};

export default Login;