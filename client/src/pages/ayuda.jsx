import { useEffect, useMemo, useState } from "react";
import "../styles/pages/ayuda.css";
import Sidebar from "../components/layout/sidebar";

const CATEGORIAS = [
  {
    id: "categoria-maquinas",
    titulo: "Máquinas",
    palabrasClave: ["maquinas", "máquinas", "maquina", "máquina"],
    texto:
      "Consultá cómo agregar, modificar y administrar las máquinas registradas.",
    detalle:
      "Desde la sección Mis máquinas podés consultar todas las máquinas registradas. Para agregar una nueva, utilizá el botón de agregar y completá los datos solicitados, como nombre, marca, número de serie y estado. También podés acceder a cada máquina para modificar sus datos o eliminarla.",
  },
  {
    id: "categoria-mantenimiento",
    titulo: "Mantenimiento",
    palabrasClave: ["mantenimiento", "mantenimientos"],
    texto:
      "Aprendé a registrar mantenimientos, actualizar información y consultar estados.",
    detalle:
      "En la sección Mantenimiento podés consultar la información de una máquina y registrar los datos correspondientes a una tarea de mantenimiento. Podés completar la fecha, descripción y estado de la máquina y luego guardar los cambios realizados.",
  },
  {
    id: "categoria-historial",
    titulo: "Historial",
    palabrasClave: ["historial", "historiales"],
    texto:
      "Consultá los cambios y mantenimientos realizados anteriormente.",
    detalle:
      "La sección Historial permite consultar los registros realizados anteriormente. Allí podés revisar los cambios de información y los mantenimientos asociados a las máquinas para conocer qué modificaciones se realizaron.",
  },
  {
    id: "categoria-configuracion",
    titulo: "Configuración",
    palabrasClave: ["configuracion", "configuración", "preferencias"],
    texto:
      "Modificá las opciones y preferencias del sistema.",
    detalle:
      "Desde Configuración podés administrar las preferencias generales del sistema y ajustar las opciones disponibles para adaptar su funcionamiento a las necesidades del usuario.",
  },
];

const PREGUNTAS = [
  {
    id: "pregunta-agregar",
    pregunta: "¿Cómo agrego una máquina?",
    palabrasClave: [
      "agregar máquina",
      "agregar maquina",
      "nueva máquina",
    ],
    respuesta:
      "Ingresá a la sección Mis máquinas desde el menú lateral y presioná Agregar máquina. Completá el nombre, tipo, marca, número de serie y estado inicial. Finalmente, guardá los cambios.",
  },
  {
    id: "pregunta-modificar",
    pregunta: "¿Cómo modifico los datos de una máquina?",
    palabrasClave: [
      "modificar máquina",
      "modificar maquina",
      "editar máquina",
    ],
    respuesta:
      "Abrí la máquina desde Mis máquinas y seleccioná la opción para editar sus datos. Una vez realizados los cambios, guardalos para actualizar la información.",
  },
  {
    id: "pregunta-eliminar",
    pregunta: "¿Cómo elimino una máquina?",
    palabrasClave: [
      "eliminar máquina",
      "eliminar maquina",
      "borrar máquina",
    ],
    respuesta:
      "Desde Mis máquinas, seleccioná la máquina que querés eliminar y elegí la opción Eliminar. Tené en cuenta que esta acción no se puede deshacer.",
  },
  {
    id: "pregunta-mantenimiento",
    pregunta: "¿Cómo registro un mantenimiento?",
    palabrasClave: [
      "registrar mantenimiento",
      "registro mantenimiento",
      "mantenimiento",
    ],
    respuesta:
      "Ingresá a la sección Mantenimiento desde el menú lateral. Completá los datos correspondientes, como fecha, descripción y estado, y luego presioná Actualizar para guardar la información.",
  },
  {
    id: "pregunta-estado",
    pregunta: "¿Cómo cambio el estado de una máquina?",
    palabrasClave: [
      "cambiar estado",
      "estado máquina",
      "estado maquina",
      "operativo",
      "no operativo",
    ],
    respuesta:
      "Abrí la máquina desde Mis máquinas o desde Mantenimiento y seleccioná el estado correspondiente: Operativo, No operativo o En mantenimiento.",
  },
  {
    id: "pregunta-historial",
    pregunta: "¿Dónde puedo consultar los mantenimientos anteriores?",
    palabrasClave: [
      "mantenimientos anteriores",
      "historial",
      "historial de mantenimiento",
    ],
    respuesta:
      "Ingresá a la sección Historial para consultar los registros anteriores y revisar los cambios y mantenimientos realizados en las máquinas.",
  },
];

const ESTADOS = [
  {
    claseColor: "estado-operativo",
    nombre: "OPERATIVO",
    texto: "La máquina se encuentra funcionando correctamente.",
  },
  {
    claseColor: "estado-no-operativo",
    nombre: "NO OPERATIVO",
    texto:
      "La máquina presenta una falla o no puede utilizarse.",
  },
  {
    claseColor: "estado-en-mantenimiento",
    nombre: "EN MANTENIMIENTO",
    texto:
      "La máquina se encuentra temporalmente fuera de servicio debido a tareas de mantenimiento.",
  },
];

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function TarjetaCategoria({
  id,
  titulo,
  texto,
  detalle,
  abierta,
  onToggle,
}) {
  return (
    <div
      id={id}
      className={`ayuda-categoria ${
        abierta ? "categoria-abierta" : ""
      }`}
    >
      <button
        type="button"
        className="ayuda-categoria-boton"
        onClick={onToggle}
      >
        <span className="ayuda-categoria-titulo">
          {titulo}
        </span>

        <span
          className={`ayuda-categoria-flecha ${
            abierta ? "abierta" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <p className="ayuda-categoria-texto">
        {texto}
      </p>

      <div
        className={`ayuda-categoria-detalle ${
          abierta ? "abierta" : ""
        }`}
      >
        <div className="ayuda-categoria-detalle-interior">
          {detalle}
        </div>
      </div>
    </div>
  );
}

function FilaPregunta({ item, abierta, onToggle }) {
  return (
    <div
      id={item.id}
      className="ayuda-faq-fila"
    >
      <button
        type="button"
        className="ayuda-faq-pregunta"
        onClick={onToggle}
      >
        <span>{item.pregunta}</span>

        <span
          className={`ayuda-faq-chevron ${
            abierta ? "abierta" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <div
        className={`ayuda-faq-respuesta-wrap ${
          abierta ? "abierta" : ""
        }`}
      >
        <div className="ayuda-faq-respuesta-inner">
          <p className="ayuda-faq-respuesta">
            {item.respuesta}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Ayuda() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);
  const [preguntaAbierta, setPreguntaAbierta] = useState(null);

  const preguntasFiltradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    if (!texto) {
      return PREGUNTAS;
    }

    return PREGUNTAS.filter((item) => {
      const contenido = normalizarTexto(
        `${item.pregunta} ${item.respuesta} ${item.palabrasClave.join(" ")}`
      );

      return contenido.includes(texto);
    });
  }, [busqueda]);

  useEffect(() => {
    const texto = normalizarTexto(busqueda);

    if (!texto) {
      return;
    }

    const temporizador = setTimeout(() => {
      let destino = null;

      if (
        texto.includes("categoria") ||
        texto.includes("categorias")
      ) {
        destino = "seccion-categorias";
      } else if (
        texto.includes("pregunta") ||
        texto.includes("preguntas") ||
        texto.includes("frecuente") ||
        texto.includes("frecuentes")
      ) {
        destino = "seccion-preguntas";
      } else if (texto.includes("maquina")) {
        const preguntaMaquina = PREGUNTAS.find((item) =>
          item.pregunta.toLowerCase().includes("máquina")
        );

        if (preguntaMaquina) {
          destino = preguntaMaquina.id;
          setPreguntaAbierta(preguntaMaquina.id);
        }

        setCategoriaAbierta("categoria-maquinas");
      } else if (texto.includes("mantenimiento")) {
        destino = "categoria-mantenimiento";
        setCategoriaAbierta("categoria-mantenimiento");
      } else if (texto.includes("historial")) {
        destino = "categoria-historial";
        setCategoriaAbierta("categoria-historial");
      } else if (texto.includes("configuracion")) {
        destino = "categoria-configuracion";
        setCategoriaAbierta("categoria-configuracion");
      } else if (
        texto.includes("estado") ||
        texto.includes("operativo")
      ) {
        destino = "seccion-estados";
      } else if (
        texto.includes("soporte") ||
        texto.includes("ayuda") ||
        texto.includes("contacto") ||
        texto.includes("administrador")
      ) {
        destino = "seccion-soporte";
      } else {
        const preguntaEncontrada = PREGUNTAS.find((item) => {
          const contenido = normalizarTexto(
            `${item.pregunta} ${item.respuesta} ${item.palabrasClave.join(" ")}`
          );

          return contenido.includes(texto);
        });

        if (preguntaEncontrada) {
          destino = preguntaEncontrada.id;
          setPreguntaAbierta(preguntaEncontrada.id);
        }
      }

      if (destino) {
        const elemento = document.getElementById(destino);

        if (elemento) {
          elemento.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    }, 300);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

  return (
    <div className="ayuda-layout">

      <Sidebar />

      <div className="ayuda-contenido">

        <main className="ayuda-page">

          <section className="ayuda-header">
            <h1 className="ayuda-titulo">
              ¿En qué podemos ayudarte?
            </h1>

            <p className="ayuda-subtitulo">
              Encontrá rápidamente información sobre el funcionamiento
              del sistema.
            </p>

            <div className="ayuda-buscador">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar una pregunta o tema..."
                className="ayuda-buscador-input"
              />
            </div>
          </section>

          <section
            id="seccion-categorias"
            className="ayuda-seccion"
          >
            <h2 className="ayuda-seccion-titulo">
              Categorías
            </h2>

            <div className="ayuda-categorias-grid">
              {CATEGORIAS.map((categoria) => (
                <TarjetaCategoria
                  key={categoria.id}
                  {...categoria}
                  abierta={categoriaAbierta === categoria.id}
                  onToggle={() =>
                    setCategoriaAbierta(
                      categoriaAbierta === categoria.id
                        ? null
                        : categoria.id
                    )
                  }
                />
              ))}
            </div>
          </section>

          <section
            id="seccion-preguntas"
            className="ayuda-seccion"
          >
            <h2 className="ayuda-seccion-titulo">
              Preguntas frecuentes
            </h2>

            <div className="ayuda-faq-card">
              {preguntasFiltradas.length > 0 ? (
                preguntasFiltradas.map((item) => (
                  <FilaPregunta
                    key={item.id}
                    item={item}
                    abierta={preguntaAbierta === item.id}
                    onToggle={() =>
                      setPreguntaAbierta(
                        preguntaAbierta === item.id
                          ? null
                          : item.id
                      )
                    }
                  />
                ))
              ) : (
                <div className="ayuda-faq-vacio">
                  <p>
                    No encontramos preguntas para "{busqueda}".
                  </p>
                </div>
              )}
            </div>
          </section>

          <section
            id="seccion-estados"
            className="ayuda-seccion"
          >
            <h2 className="ayuda-seccion-titulo">
              Estados de las máquinas
            </h2>

            <div className="ayuda-estados-card">
              {ESTADOS.map((estado) => (
                <div
                  key={estado.nombre}
                  className="ayuda-estado-fila"
                >
                  <span
                    className={`ayuda-estado-punto ${estado.claseColor}`}
                  ></span>

                  <div className="ayuda-estado-contenido">
                    <div
                      className={`ayuda-estado-nombre ${estado.claseColor}`}
                    >
                      {estado.nombre}
                    </div>

                    <p className="ayuda-estado-texto">
                      {estado.texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            id="seccion-soporte"
            className="ayuda-contacto-card"
          >
            <h2 className="ayuda-contacto-titulo">
              ¿Necesitás más ayuda?
            </h2>

            <p className="ayuda-contacto-texto">
              Si no encontraste la respuesta que buscabas,
              contactá al administrador del sistema.
            </p>

            <a
              href="https://wa.me/5492281548548?text=Hola%2C%20necesito%20ayuda%20con%20el%20sistema"
              target="_blank"
              rel="noopener noreferrer"
              className="ayuda-contacto-boton"
            >
              Contactar soporte
            </a>
          </section>

        </main>

      </div>

    </div>
  );
}