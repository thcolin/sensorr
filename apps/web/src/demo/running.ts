import { App } from './server/app'
import { install } from './server/http'
import { Store } from './server/store'
import { seedOf } from './seed'

declare const SENSORR_DEMO_TMDB_KEY: string

// Set by the `demo` build, see `apps/web/webpack.config.js`
export const credentials = { username: process.env.NX_SENSORR_USERNAME, password: process.env.NX_SENSORR_PASSWORD }

export const app = seedOf(SENSORR_DEMO_TMDB_KEY).then((seed) => new App(new Store(seed)))

install(app)

// Back to the seed: the page reloads, as the services keep what they read in memory
export const reset = async () => {
  (await app.catch(() => null))?.store.reset()
  globalThis.location.reload()
}
