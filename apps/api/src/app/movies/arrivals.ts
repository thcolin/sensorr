// A movie reaches Plex when `sync` first gives it a Plex link: `record` already writes `archived` at the grab.
// It is dated once, so a movie Plex loses and finds again never comes back in a mail.
export const arrivedOf = (changes: { [id: string]: { plex_url?: string } }, stored: { _id: unknown, plex_url?: string, archived_at?: number }[]) => {
  const known = new Map(stored.map((movie) => [String(movie._id), movie]))
  return Object.keys(changes).filter((id) => {
    const movie = known.get(String(id))
    return !!changes[id].plex_url && !!movie && !movie.plex_url && !movie.archived_at
  })
}
