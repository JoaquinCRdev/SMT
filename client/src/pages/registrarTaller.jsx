import "../styles/pages/registrarTaller.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const RegistrarTaller = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.nombre.trim().length < 3) {
      setError("El nombre del taller debe tener al menos 3 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/workshops", {
        name: formData.nombre,
        address: formData.direccion || undefined,
        phone: formData.telefono || undefined,
      });

      // El usuario ahora tiene workshop asignado; refrescamos el contexto
      // pidiendo el perfil actualizado para que ProtectedRoute lo detecte.
      const { data: profile } = await api.get("/profile");
      setUser(profile);

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar el taller");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="RegistrarTaller">
      <button id="botonvolver" type="button">
        <NavLink to="/mismaquinas">← Volver</NavLink>
      </button>

      <div id="containerRegistrarTaller">
        {error && <p id="errorRegistrarTaller">{error}</p>}

        <form id="containerRegistrarTallerForm" onSubmit={handleSubmit}>
          <div className="panel-taller informacion-taller">
            <h1>Información de tu taller</h1>

            <div className="campo">
              <label htmlFor="nombreTaller">Nombre del taller</label>
              <input
                id="nombreTaller"
                name="nombre"
                type="text"
                placeholder="Ej: Taller Central"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="direccionTaller">Dirección</label>
              <input
                id="direccionTaller"
                name="direccion"
                type="text"
                placeholder="Ej: Av.libertad 123"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="campo">
              <label htmlFor="telefonoTaller">Teléfono</label>
              <input
                id="telefonoTaller"
                name="telefono"
                type="tel"
                placeholder="Ej: 11 1234-5678"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
          </div>

          <button id="botonRegistrarTaller" type="submit" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar taller"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrarTaller;