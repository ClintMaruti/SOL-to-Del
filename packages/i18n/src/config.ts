import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enCommon from "./locales/en/common.json";
import enAdmin from "./locales/en/admin.json";
import enClient from "./locales/en/client.json";

import esCommon from "./locales/es/common.json";
import esAdmin from "./locales/es/admin.json";
import esClient from "./locales/es/client.json";

const resources = {
  en: {
    common: enCommon,
    admin: enAdmin,
    client: enClient,
  },
  es: {
    common: esCommon,
    admin: esAdmin,
    client: esClient,
  },
};

i18n
  .use(LanguageDetector) // Detects user language from browser
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "admin", "client"],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order of language detection
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
