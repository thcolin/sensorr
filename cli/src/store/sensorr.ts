import fetch from 'node-fetch'

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch
}

import { Sensorr } from '@sensorr/sensorr'
import config from './config'

const sensorr = new Sensorr({ znabs: config.get('znabs'), region: config.get('region') })
export default sensorr

export const SENSORR_POLICIES = config.get('policies')
