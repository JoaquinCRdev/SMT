import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./locales/es.json";
import en from "./locales/en.json";
import de from "./locales/de.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        translation: es,
      },
      en: {
        translation: en,
      },
      de: {
        translation: de,
      },
    },

    lng: "es",
    fallbackLng: "es",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;