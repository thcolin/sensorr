import i18next from 'i18next'
import icuFormat from 'i18next-icu'
import en from './translations/en/mail'
import fr from './translations/fr/mail'
import { LANGUAGES, languageOf } from './language'

// The API has no browser to ask, it writes in the language of the TMDB region
const i18n = i18next.createInstance()

i18n.use(icuFormat).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  fallbackLng: 'en',
  supportedLngs: LANGUAGES,
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
})

export const translatorOf = (region?: string) => {
  const language = languageOf(region, [])
  return Object.assign(i18n.getFixedT(language), { language })
}

export type Translator = ReturnType<typeof translatorOf>
