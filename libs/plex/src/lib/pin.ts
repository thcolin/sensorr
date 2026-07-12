import fetch from 'node-fetch'

const PLEX_API_URL = 'https://plex.tv/api/v2'

// Shape shared with the `Plex()` factory second argument (from package.json)
export type PlexApp = { name: string, version: string, plex: string }

const buildHeaders = ({ name, version, plex }: PlexApp) => ({
  'X-Plex-Client-Identifier': plex,
  'X-Plex-Product': name,
  'X-Plex-Version': version,
  'X-Plex-Device-Name': name,
  'accept': 'application/json',
})

export type Pin = { id: string, code: string, expiresAt: number }

// Request a short-lived 4-character PIN to be entered by the user on https://plex.tv/link
// Modern JSON flow (https://plex.tv/api/v2/pins), replaces the deprecated XML `/pins.xml`.
export const createPin = async (app: PlexApp): Promise<Pin> => {
  const res = await fetch(`${PLEX_API_URL}/pins`, {
    method: 'POST',
    headers: buildHeaders(app),
  })

  if (res.status !== 201) {
    throw new Error(`Unable to request a new Plex PIN (HTTP ${res.status})`)
  }

  const { id, code, expiresIn } = (await res.json()) as { id: number, code: string, expiresIn: number }
  return { id: String(id), code, expiresAt: Date.now() + (expiresIn * 1000) }
}

export type PinStatus =
  | { status: 'waiting' }
  | { status: 'authorized', token: string }
  | { status: 'invalid' }

// Check a PIN status. The X-Plex-Client-Identifier MUST be the same one used to create the PIN,
// otherwise Plex answers 404 (as if the PIN did not exist).
export const checkPin = async (id: string, app: PlexApp): Promise<PinStatus> => {
  const res = await fetch(`${PLEX_API_URL}/pins/${id}`, {
    method: 'GET',
    headers: buildHeaders(app),
  })

  // 404 (Plex error code 1020 "Code not found or expired") means the PIN is unknown or expired
  if (res.status === 404) {
    return { status: 'invalid' }
  }

  if (!res.ok) {
    throw new Error(`Unable to check Plex PIN "${id}" (HTTP ${res.status})`)
  }

  const { authToken } = (await res.json()) as { authToken: string | null }
  return authToken ? { status: 'authorized', token: authToken } : { status: 'waiting' }
}

// Keep a Plex account token alive and validate it. Plex expires tokens based on last-used time,
// and neither profile (/api/v2/user) nor watchlist reads refresh it — but /api/v2/ping does.
// (cf Sonarr, PlexTvProxy.Ping: "tell plex.tv that we're still active and tokens should not be expired")
// Returns true when the token is still valid (and its last-seen has been refreshed), false when dead.
export const pingToken = async (token: string, app: PlexApp): Promise<boolean> => {
  const res = await fetch(`${PLEX_API_URL}/ping?X-Plex-Token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: buildHeaders(app),
  })

  return res.ok
}
