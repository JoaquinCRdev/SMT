import "../../../styles/components/layout/auth/register.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nombre.trim()) {
      setError("Ingrese un nombre completo");
      return;
    }

    setSubmitting(true);

    try {
      console.log("import.meta.env.VITE_API_URL:", import.meta.env.VITE_API_URL);
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/register`,
        {
          name: formData.nombre,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        },
        { withCredentials: true } // necesario para que viaje la cookie del refreshToken
      );

      // Guardamos el accessToken donde lo estés manejando por ahora
      // (por ejemplo localStorage, hasta que se arme un manejo en memoria)
      localStorage.setItem("accessToken", data.accessToken);

      if (data.user.role === "admin") {
        navigate("/crearTaller");
      } else {
        navigate("/asociarseTaller");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="contenedorRegisterPersonal">
      <div id="ladoIzquierdoRegisterPersonal">
        <h1>Crea tu cuenta para comenzar</h1>
        <div id="inputsRegisterPersonal">
          {error && <p id="errorRegisterPersonal">{error}</p>}

          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            value={formData.nombre}
            onChange={handleChange}
            pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]{3,50}$"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña (mínimo 8 caracteres)"
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
              Personal
            </button>
            <button
              type="button"
              className={formData.role === "admin" ? "rolActivo" : ""}
              onClick={() => handleRoleSelect("admin")}
            >
              Admin
            </button>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
        <p>
          ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
        </p>
      </div>

      <div id="ladoDerechoRegisterPersonal">
        <h2>
          Unete a la red
          <br />
          de talleres que
          <br />
          crecen con SMT
        </h2>
        <div id="beneficiosRegisterPersonal">
          <div>
            <img src="registrartaller.png" alt="Registra tu taller"></img>
            <p>
              Accede desde
              <br />
              cualquier dispositivo
            </p>
          </div>
          <div>
            <img
              src="administratusmaquinas.png"
              alt="Administra tus maquinas"
            ></img>
            <p>
              Informacion segura
              <br />
              y confiable
            </p>
          </div>
          <div>
            <img src="contactanos.png" alt="Contacto"></img>
            <p>Soporte tecnico</p>
          </div>
        </div>

        <div id="contactoRegisterPersonal">
          <div id="textoContactoRegisterPersonal">
            <p>© 2026 SMT. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;