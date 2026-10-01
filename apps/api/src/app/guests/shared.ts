const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decode = (value: string) => value.replace(/&(?:(amp|lt|gt|quot|apos)|#(\d+)|#x([0-9a-f]+));/gi, (_, name, dec, hex) => name ? ENTITIES[name] : String.fromCodePoint(dec ? Number(dec) : parseInt(hex, 16)))

// The users a Plex server is shared with, from the XML of `plex.tv/api/users`
export const sharedUsersOf = (xml: string) => [...xml.matchAll(/<User ([^>]*)>/g)]
  .map(([, attributes]) => Object.fromEntries([...attributes.matchAll(/(\w+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)])))
  .map(({ id, title, username, email, thumb }) => ({ id: Number(id), name: title || username, email, avatar: thumb }))

export const sharedIdsOf = (xml: string) => new Set(sharedUsersOf(xml).map(({ id }) => id))

type SharedUser = ReturnType<typeof sharedUsersOf>[number]
type Activity = { _id: number, plays: number, seen: number }

// The shared users who are not guests yet, most recent viewers first, by name when no Tautulli viewer was imported
export const invitableOf = ({ users, guests, viewers, activity, invited }: { users: SharedUser[], guests: string[], viewers: { _id: number, email: string }[], activity: Activity[], invited: Record<string, number> }) => {
  const guest = new Set(guests.map((email) => email.toLowerCase()))
  const viewerOf = Object.fromEntries(viewers.map(({ _id, email }) => [email.toLowerCase(), _id]))
  const activityOf = Object.fromEntries(activity.map(({ _id, plays, seen }) => [_id, { plays, seen_at: seen * 1000 }]))
  const tautulli = viewers.length > 0

  return users
    .filter(({ email }) => email && !guest.has(email.toLowerCase()))
    .map(({ name, email, avatar }) => ({
      name,
      email,
      avatar,
      ...(tautulli ? { plays: 0, seen_at: null, ...activityOf[viewerOf[email.toLowerCase()]] } : {}),
      invited_at: invited[email.toLowerCase()] || null,
    }))
    .sort((a, b) => (tautulli ? (b.seen_at || 0) - (a.seen_at || 0) : 0) || (a.name || a.email).localeCompare(b.name || b.email))
}
