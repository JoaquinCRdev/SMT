import "../../../styles/components/layout/auth/registerPersonal.css";
import { useState } from "react";

const RegisterPersonal = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
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
      alert("ingrese un nombre completo");
      return;
    }

    console.log(formData);
  };

  return (
    <div id="contenedorRegisterPersonal">
      <div id="ladoIzquierdoRegisterPersonal">
        <h1>Crea tu cuenta para comenzar</h1>
        <div id="inputsRegisterPersonal">
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
        </div>
        <button onClick={handleSubmit}>Crear cuenta</button>
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
              <br/>
              y confiable
            </p>
          </div>
          <div>
            <img
              src="contactanos.png"
              alt="Contacto"
            ></img>
            <p> 
              Soporte tecnico
            </p>
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

export default RegisterPersonal;
