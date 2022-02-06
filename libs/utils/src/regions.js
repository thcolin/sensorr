import { countries, flag, name } from 'country-emoji'
import cl from 'country-language'

let cache = []

export const regions = {
  all: async () => {
    if (cache.length) {
      return cache
    }

    cache = (await Promise.all(
      Object.keys(countries).map(country => new Promise(resolve => cl.getCountryLanguages(country, (err, languages = []) => {
        if (!err && languages && languages.length && languages[0].iso639_1) {
          resolve({ country, language: languages[0]?.iso639_1, emoji: flag(country), name: name(country) })
        } else {
          resolve(null)
        }
      })))
    )).filter(region => region)

    return cache
  },
}
