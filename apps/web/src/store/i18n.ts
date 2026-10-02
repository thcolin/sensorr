import i18n from '@sensorr/i18n'

declare const SENSORR_DEFAULTS: { [key: string]: any }

try {
  i18n.changeLanguage(SENSORR_DEFAULTS.region || localStorage.getItem('region') || 'en-US')
} catch (err) {
  console.warn(err)
}

export default i18n
