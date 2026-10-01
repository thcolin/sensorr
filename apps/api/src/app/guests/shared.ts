const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decode = (value: string) => value.replace(/&(?:(amp|lt|gt|quot|apos)|#(\d+)|#x([0-9a-f]+));/gi, (_, name, dec, hex) => name ? ENTITIES[name] : String.fromCodePoint(dec ? Number(dec) : parseInt(hex, 16)))

// The users a Plex server is shared with, from the XML of `plex.tv/api/users`
export const sharedUsersOf = (xml: string) => [...xml.matchAll(/<User ([^>]*)>/g)]
  .map(([, attributes]) => Object.fromEntries([...attributes.matchAll(/(\w+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)])))
  .map(({ id, title, username, email, thumb }) => ({ id: Number(id), name: title || username, email, avatar: thumb }))

export const sharedIdsOf = (xml: string) => new Set(sharedUsersOf(xml).map(({ id }) => id))
