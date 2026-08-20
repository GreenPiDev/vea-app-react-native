import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import tr from '../locales/tr/translation.json';
import en from '../locales/en/translation.json';

// Adapted from vea-frontend/src/lib/i18n.ts — same flat translation.json
// shape, same keySeparator/nsSeparator: false rationale (a key like
// "authTitle" must resolve literally, never split on a dot). Difference:
// initial language comes from the device locale (expo-localization)
// instead of a hardcoded 'tr', falling back to 'tr' for unsupported
// locales — mobile has no in-app language switcher yet either way.
const deviceLanguage = Localization.getLocales()[0]?.languageCode;
const initialLng = deviceLanguage === 'en' ? 'en' : 'tr';

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'tr',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});

export default i18n;
