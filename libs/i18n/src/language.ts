export const LANGUAGES = ['en', 'fr']

// The browser's languages first, then the TMDB region, then English
export const languageOf = (region?: string, preferred: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language]) =>
  [...preferred, region].map((tag) => tag?.slice(0, 2).toLowerCase()).find((language) => LANGUAGES.includes(language)) || 'en'
