import "../../../styles/components/layout/auth/registerAdmin.css";
import { useState } from "react";

const RegisterAdmin = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    cuit: "",
    direccion: "",
    telefono: "",
    logo: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert("Ingrese el nombre del taller");
      return;
    }

    console.log(formData);
  };

  return (
    <div id="contenedorRegisterAdmin">
      <div id="ladoIzquierdoRegisterAdmin">
        <h1>Registra el taller que administras</h1>
        <div id="inputsRegisterAdmin">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del taller"
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
          <input
            type="text"
            name="cuit"
            placeholder="CUIT/NIT"
            value={formData.cuit}
            onChange={handleChange}
            pattern="[0-9]{11}"
            maxLength={11}
            required
          />
          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={formData.direccion}
            onChange={handleChange}
            pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9#.,/\- ]{5,100}$"
            required
          />
          <input
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={handleChange}
            pattern="[0-9]{8,15}"
            maxLength={15}
            required
          />
          <div id="inputFileRegisterAdmin">
            <label htmlFor="logo">
              {formData.logo
                ? formData.logo.name
                : "Logo del taller (opcional)"}
            </label>

            <input
              id="logo"
              type="file"
              name="logo"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleChange}
            />
          </div>
        </div>
        <button onClick={handleSubmit}>Registrar</button>
        <p>
          ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
        </p>
      </div>

      <div id="ladoDerechoRegisterAdmin">
        <h2>
          Gestiona tu taller
          <br />
          de forma simple,
          <br />
          rápida y eficiente
        </h2>
        <div id="beneficiosRegisterAdmin">
          <div>
            <img src="registrartaller.png" alt="Registra tu taller"></img>
            <p>Registra tu taller</p>
          </div>
          <div>
            <img
              src="administratusmaquinas.png"
              alt="Administra tus maquinas"
            ></img>
            <p>Administra tus maquinas</p>
          </div>
          <div>
            <img src="gestionatuequipo.png" alt="Gestiona tu equipo"></img>
            <p>Gestiona tu equipo</p>
          </div>
          <div>
            <img
              src="seguimientodeactividades.png"
              alt="Seguimiento de actividades"
            ></img>
            <p>Seguimiento de actividades</p>
          </div>
          <div>
            <img
              src="reportesyestadisticas.png"
              alt="Reportes y estadísticas"
            ></img>
            <p>Reportes y estadísticas</p>
          </div>
        </div>
        <div id="contactoRegisterAdmin">
          <div id="textoContactoRegisterAdmin">
            <p>¿Necesitas ayuda?</p>
            <a
              href="https://wa.me/542281548548"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contactanos
            </a>
          </div>

          <img src="contactanos.png" alt="Contacto" />
        </div>
      </div>
    </div>
  );
};

export default RegisterAdmin;
