import fetch from 'node-fetch'

export type Channel = 'dev' | 'beta' | 'stable'

export const TAGS = { beta: 'beta', stable: 'latest' } as const

export const channelOf = (tag?: string): Channel | null => {
  if (!tag) {
    return null
  }

  if (tag === 'dev' || tag.startsWith('sha-')) {
    return 'dev'
  }

  return tag === 'beta' || /-beta\.\d+$/.test(tag) ? 'beta' : 'stable'
}

const REGISTRY = 'https://ghcr.io'
const IMAGE = 'thcolin/sensorr-api'
const MANIFESTS = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.v2+json',
].join(',')

export const versionOn = async (tag: string): Promise<string | null> => {
  const get = async (url: string, headers = {}) => {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })

    if (!res.ok && res.status !== 404) {
      throw new Error(`GHCR answered ${res.status} for ${url.replace(REGISTRY, '')}`)
    }

    return res.ok ? (res.json() as Promise<any>) : null
  }

  const { token } = await get(`${REGISTRY}/token?scope=repository:${IMAGE}:pull`)
  const headers = { Authorization: `Bearer ${token}`, Accept: MANIFESTS }
  let manifest = await get(`${REGISTRY}/v2/${IMAGE}/manifests/${tag}`, headers)

  if (!manifest) {
    return null
  }

  if (manifest.manifests) {
    const { digest } = manifest.manifests.find(({ platform }) => platform?.os !== 'unknown')
    manifest = await get(`${REGISTRY}/v2/${IMAGE}/manifests/${digest}`, headers)
  }

  const blob = await get(`${REGISTRY}/v2/${IMAGE}/blobs/${manifest.config.digest}`, headers)
  return blob?.config?.Labels?.['org.opencontainers.image.version'] || null
}
