import "../../../styles/components/layout/auth/login.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { getRedirectPath } from "../../../utils/redirectByUser";

const Login = ({ onToggle }) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useTranslation();

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
      setError(t("pages.auth.login.error_email_invalido"));
      return;
    }

    if (formData.password.trim() === "") {
      setError(t("pages.auth.login.error_password_vacia"));
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
      setError(err.response?.data?.message || t("pages.auth.login.error_generico"));
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
          alt={t("pages.auth.login.alt_logo")}
        />

        <h1>{t("pages.auth.login.titulo")}</h1>

        <div className="form-containerLogin">
          <div className="form-gridLogin">
            {error && <p id="errorLogin">{error}</p>}

            <div className="input-groupLogin">
              <label>{t("pages.auth.login.label_email")}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-groupLogin">
              <label>{t("pages.auth.login.label_password")}</label>
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
          {submitting
            ? t("pages.auth.login.boton_cargando")
            : t("pages.auth.login.boton")}
        </button>

        <p>
          {t("pages.auth.login.sin_cuenta")}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
          >
            {t("pages.auth.login.link_registro")}
          </a>
        </p>
      </div>

      <div id="ladoDerechoLogin">
        <img src="/logoblanco.png" alt={t("pages.auth.login.alt_imagen")} />
      </div>
    </div>
  );
};

export default Login;