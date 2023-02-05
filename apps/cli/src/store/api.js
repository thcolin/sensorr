import { API } from '@sensorr/services'

const api = new API(`${process.env.NX_API_PROTOCOL || 'http:'}//${process.env.NX_API_HOST || 'localhost'}:${process.env.NX_API_PORT || 4300}/api/`)

export default api
