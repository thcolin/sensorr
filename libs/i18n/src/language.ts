export const LANGUAGES = ['en', 'fr']

// The language set in Settings, else the browser's languages, then the TMDB region, then English
export const languageOf = ({ language, region }: { language?: string, region?: string } = {}, preferred: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language]) =>
  [language, ...preferred, region].map((tag) => tag?.slice(0, 2).toLowerCase()).find((candidate) => LANGUAGES.includes(candidate)) || 'en'
