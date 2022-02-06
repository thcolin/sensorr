import i18n from '@sensorr/i18n'
import config from './config'

i18n.changeLanguage(config.get('region') || localStorage.getItem('region') || 'en-US')

export default i18n
