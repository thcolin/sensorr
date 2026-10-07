import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import icuFormat from 'i18next-icu'
import en from './translations/en/wrapped'
import fr from './translations/fr/wrapped'
import { LANGUAGES, languageOf } from './language'

export { LANGUAGES, languageOf }

// The guests' wrapped carries its own words only: the full set reaches `@sensorr/utils` and triples the page
i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
})

i18n
  .use(icuFormat)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: languageOf(),
    fallbackLng: 'en',
    supportedLngs: LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
