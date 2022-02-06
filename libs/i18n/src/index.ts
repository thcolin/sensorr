import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import icuFormat from 'i18next-icu'
import fr from './translations/fr'
import en from './translations/en'

i18n
  .use(icuFormat)
  .use(initReactI18next)
  .init({
    // debug: true,
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: 'en-US',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
