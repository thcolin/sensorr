import PlexAPI from 'plex-api'
import PlexPinAuth from 'plex-api-pinauth'

export const Plex = ({ url, token = null, fallbackPort = 32400 }, { name, version, plex }) => {
  const urlObj = new URL(url)
  const client = new PlexAPI({
    hostname: urlObj.hostname,
    port: urlObj.port || fallbackPort,
    https: urlObj.protocol === 'https:',
    token: token,
    authenticator: PlexPinAuth({ token }),
    responseParser: (response, body) => Promise.resolve(body.toString('utf8')).then(JSON.parse),
    options: {
      identifier: plex,
      product: name,
      version: version,
      deviceName: name,
    },
  })

  return client
}
