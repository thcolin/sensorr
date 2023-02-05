declare const SENSORR_DEFAULTS: { [key: string]: any }

import i18n from '@sensorr/i18n'

try {
  i18n.changeLanguage(SENSORR_DEFAULTS.region || localStorage.getItem('region') || 'en-US')
} catch (err) {
  console.warn(err)
}

export default i18n
