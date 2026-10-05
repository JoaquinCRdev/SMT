import "../../../styles/components/layout/auth/register.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { getRedirectPath } from "../../../utils/redirectByUser";

const Register = ({ onToggle }) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.nombre.trim().length < 3) {
      setError(t("pages.auth.register.error_nombre_corto"));
      return;
    }

    if (!emailRegex.test(formData.email)) {
      setError(t("pages.auth.register.error_email_invalido"));
      return;
    }

    if (formData.password.length < 8) {
      setError(t("pages.auth.register.error_password_corta"));
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/register", {
        name: formData.nombre,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      navigate(getRedirectPath(data.user));
    } catch (err) {
      setError(err.response?.data?.message || t("pages.auth.register.error_generico"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="contenedorRegisterPersonal">
      <div id="ladoIzquierdoRegisterPersonal">
        <h1>{t("pages.auth.register.titulo")}</h1>
        <div id="inputsRegisterPersonal">
          {error && <p id="errorRegisterPersonal">{error}</p>}

          <input
            type="text"
            name="nombre"
            placeholder={t("pages.auth.register.placeholder_nombre")}
            value={formData.nombre}
            onChange={handleChange}
            pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]{3,50}$"
            required
          />
          <input
            type="email"
            name="email"
            placeholder={t("pages.auth.register.placeholder_email")}
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder={t("pages.auth.register.placeholder_password")}
            value={formData.password}
            onChange={handleChange}
            minLength={8}
            required
          />

          <div id="rolRegisterPersonal">
            <button
              type="button"
              className={formData.role === "user" ? "rolActivo" : ""}
              onClick={() => handleRoleSelect("user")}
            >
              {t("pages.auth.register.rol_personal")}
            </button>
            <button
              type="button"
              className={formData.role === "admin" ? "rolActivo" : ""}
              onClick={() => handleRoleSelect("admin")}
            >
              {t("pages.auth.register.rol_admin")}
            </button>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? t("pages.auth.register.boton_cargando")
            : t("pages.auth.register.boton")}
        </button>
        <p>
          {t("pages.auth.register.ya_cuenta")}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
          >
            {t("pages.auth.register.link_login")}
          </a>
        </p>
      </div>

      <div id="ladoDerechoRegisterPersonal">
        <h2>
          {t("pages.auth.register.lado_derecho_titulo_1")}
          <br />
          {t("pages.auth.register.lado_derecho_titulo_2")}
          <br />
          {t("pages.auth.register.lado_derecho_titulo_3")}
        </h2>
        <div id="beneficiosRegisterPersonal">
          <div>
            <img
              src="registrartaller.png"
              alt={t("pages.auth.register.alt_registrar")}
            ></img>
            <p>
              {t("pages.auth.register.beneficio_dispositivo_1")}
              <br />
              {t("pages.auth.register.beneficio_dispositivo_2")}
            </p>
          </div>
          <div>
            <img
              src="administratusmaquinas.png"
              alt={t("pages.auth.register.alt_administrar")}
            ></img>
            <p>
              {t("pages.auth.register.beneficio_informacion_1")}
              <br />
              {t("pages.auth.register.beneficio_informacion_2")}
            </p>
          </div>
          <div>
            <img
              src="contactanos.png"
              alt={t("pages.auth.register.alt_contacto")}
            ></img>
            <p>{t("pages.auth.register.beneficio_soporte")}</p>
          </div>
        </div>

        <div id="contactoRegisterPersonal">
          <div id="textoContactoRegisterPersonal">
            <p>{t("pages.auth.register.footer")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;