import oleoo from 'oleoo'
import { languages } from '@sensorr/utils'

// Releases tag the language when it is not English: an English region gets no MULTi nor VO example
export const policyExamplesOf = (region = '') => {
  const code = region.split('-')[0]
  const language = languages[code]
  const tag = language && Object.keys(oleoo.rules.language).find((key) => key.toLowerCase() === language.name.toLowerCase())
  const tagged = !!tag && tag !== 'ENGLiSH'

  return [
    ...(tagged ? [
      { name: 'MULTi', sorting: 'seeders', descending: true, require: {}, prefer: { language: ['MULTi', tag] }, avoid: {} },
      { name: `${language.emoji} VO`, sorting: 'seeders', descending: true, require: {}, prefer: { language: [tag] }, avoid: {}, match: { original_languages: [code] } },
    ] : []),
    { name: 'Light', sorting: 'size', descending: false, require: {}, prefer: {}, avoid: { resolution: ['2160p'] } },
    { name: '4K', sorting: 'size', descending: true, require: {}, prefer: { resolution: ['2160p', '1080p'] }, avoid: {} },
  ]
}
