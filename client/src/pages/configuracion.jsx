import Sidebar from "../components/layout/sidebar";
import "../styles/pages/configuracion.css";
import { useEffect, useState } from "react";
import i18n from "../i18n/i18n";
import { useAuth } from "../context/AuthContext";
import { useWorkshop } from "../context/WorkshopContext";
import CodigoTallerCard from "../components/configuracion/CodigoTallerCard";
import PersonalizacionSection from "../components/configuracion/PersonalizacionSection";
import PersonalSection from "../components/configuracion/PersonalSection";
import SolicitudesSection from "../components/configuracion/SolicitudesSection";
import AccionesSection from "../components/configuracion/AccionesSection";

const Configuracion = () => {
  const { user, refetchProfile } = useAuth();
  const { workshop, refetchWorkshop } = useWorkshop();

  const isOwner =
    workshop && user && String(workshop.owner?._id || workshop.owner) === String(user._id);

  const [, setIdioma] = useState(i18n.language);
  const cambiarIdioma = async (e) => {
    const nuevoIdioma = e.target.value;
    await i18n.changeLanguage(nuevoIdioma);
    setIdioma(nuevoIdioma);
  };

  const [modoOscuro, setModoOscuro] = useState(() => {
    const saved = localStorage.getItem("mode");
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.body.classList.toggle("light-mode", !modoOscuro);
    localStorage.setItem("mode", JSON.stringify(modoOscuro));
  }, [modoOscuro]);

  const toggleModoOscuro = () => setModoOscuro((v) => !v);

  const [tamanoGrande, setTamanoGrande] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved === "grande";
  });

  useEffect(() => {
    document.body.classList.toggle("tamano-grande", tamanoGrande);
    localStorage.setItem("fontSize", tamanoGrande ? "grande" : "pequeno");
  }, [tamanoGrande]);

  const toggleTamano = () => setTamanoGrande((v) => !v);

  return (
    <div className="containerConfig">
      <Sidebar />

      <div className="smt-page">
        <header className="top-header">
          <button className="mobile-menu-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="mobile-brand">
            <div className="logo-badge">SMT</div>
          </div>

          <div className="top-header-right">
            <button className="notification-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <div className="user-profile">
              <div className="avatar-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="user-info">
                <span className="user-name">
                  {user?.name}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
                <span className="user-role">
                  {isOwner ? "Propietario" : user?.role === "admin" ? "Admin" : "Colaborador"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-header">
          <h1 className="page-title">{i18n.t("pages.configuracion.title")}</h1>
          <p className="page-subtitle">{i18n.t("pages.configuracion.subtitle")}</p>
        </div>

        <CodigoTallerCard code={workshop?.code} />

        <PersonalizacionSection
          modoOscuro={modoOscuro}
          toggleModoOscuro={toggleModoOscuro}
          tamanoGrande={tamanoGrande}
          toggleTamano={toggleTamano}
          cambiarIdioma={cambiarIdioma}
        />

        <PersonalSection workshop={workshop} isOwner={isOwner} />

        {isOwner && <SolicitudesSection />}

        {isOwner && (
          <AccionesSection
            workshop={workshop}
            refetchWorkshop={refetchWorkshop}
            refetchProfile={refetchProfile}
          />
        )}
      </div>
    </div>
  );
};

export default Configuracion;