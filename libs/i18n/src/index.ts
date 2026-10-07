import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import icuFormat from 'i18next-icu'
import { enUS, fr as frFR } from 'date-fns/locale'
import fr from './translations/fr'
import en from './translations/en'
import { LANGUAGES, languageOf } from './language'

export { LANGUAGES, languageOf }

export const dateLocale = () => (i18n.language === 'fr' ? frFR : enUS)

i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
})

i18n
  .use(icuFormat)
  .use(initReactI18next)
  .init({
    // debug: true,
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: languageOf(),
    fallbackLng: 'en',
    supportedLngs: LANGUAGES,
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
