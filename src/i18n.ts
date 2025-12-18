import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uiEn from "./i18n/ui/en.json";
import uiZh from "./i18n/ui/zh.json";
import manuEn from "./i18n/manufacturer/en.json";
import manuZh from "./i18n/manufacturer/zh.json";
import vhclEn from "./i18n/vehicle/en.json";
import vhclZh from "./i18n/vehicle/zh.json";
import vItemEn from "./i18n/vehicle_item/en.json";
import vItemZh from "./i18n/vehicle_item/zh.json";

const resources = {
  en: {
    ui: uiEn,
    manufacturer: manuEn,
    vehicle: vhclEn,
    vehicle_item: vItemEn,
  },
  zh: {
    ui: uiZh,
    manufacturer: manuZh,
    vehicle: vhclZh,
    vehicle_item: vItemZh,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "zh", // default language
  fallbackLng: "en",
  ns: ["ui", "manufacturer", "vehicle", "vehicle_item"],
  defaultNS: "ui",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
