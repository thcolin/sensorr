import type { Art } from '../app/themes/types'

// The demo has one wrapped, Alex's, which `tools/demo/seed.ts` computes into `share.json` as `WrappedService.share`
// answers it. The page asks the API as it does behind Sensorr, and is answered from that file
const TOKEN = 'demo'
// As `TMDB_SIZES` in `apps/api/src/app/wrapped/wrapped.service.ts`: every poster of the demo is TMDB's
const SIZES: Record<number, string> = { 320: 'w342', 640: 'w780', 1280: 'w1280' }

let share: Promise<any> | null = null
const shareOf = () => (share ??= original(new URL('demo/share.json', document.baseURI)).then((res) => res.ok
  ? res.json()
  : Promise.reject(new Error(`[Demo] The demo wrapped answered ${res.status}`))))

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const original = window.fetch.bind(window)

window.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), document.baseURI)
  const [, route] = url.pathname.match(/^\/api\/wrapped\/(.+)$/) || []

  switch (route) {
    case undefined:
      return original(input, init)
    case 'look':
      return json((await shareOf()).look)
    case `share/${TOKEN}`:
      return json(await shareOf())
    // Another token, as a link renewed since behind Sensorr
    default:
      return json({ statusCode: 404, message: 'Not Found' }, 404)
  }
}

export const demo: { art: Art } = {
  art: (item, kind = 'thumb', width = 640) => `https://image.tmdb.org/t/p/${SIZES[width]}${item[kind]}`,
}
