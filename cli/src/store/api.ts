import '../env'
import fetch from 'node-fetch'

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch
}

import { API } from '@sensorr/services'

const api = new API(`http://${process.env.NX_API_HOST}:${process.env.NX_API_PORT}/api/`)

export default api
