import dayjs from "dayjs";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import "dayjs/locale/ko";
import "dayjs/locale/en";

import { resources } from "./resource";

const i18nConfig = {
  resources,
  fallbackLng: "ko",
  detection: {
    order: ["querystring", "path"],
    lookupQuerystring: "language",
  },
  returnEmptyString: false,
  // debug: import.meta.env.DEV,
  // react: { transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'li', 'ol'] },
};

const updateLanguage = (lng) => {
  window.location.reload();
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(i18nConfig);
i18next.on("initialized", () => dayjs.locale(i18next.language));
i18next.on("languageChanged", updateLanguage);

export default i18next;