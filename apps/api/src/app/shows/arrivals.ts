// An episode reaches Plex when a known one gets its first file, dated once: an episode created with its files,
// by `migrate sonarr` or from Plex, is history, and one that loses its file and finds it again stays dated
export const landedOf = (changes: { [id: string]: { files?: unknown[] } }, stored: { _id: unknown, files?: unknown[], files_at?: number }[]) => {
  const known = new Map(stored.map((episode) => [String(episode._id), episode]))
  return Object.keys(changes).filter((id) => {
    const episode = known.get(String(id))
    return !!changes[id].files?.length && !!episode && !episode.files?.length && !episode.files_at
  })
}
