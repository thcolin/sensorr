import fetch from 'node-fetch'

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch
}

import { TMDB } from '@sensorr/tmdb'
import config from './config'

const tmdb = new TMDB({
  key: config.get('tmdb'),
  region: config.get('region') || localStorage.getItem('region') || 'en-US',
  adult: config.get('adult'),
})

export default tmdb
