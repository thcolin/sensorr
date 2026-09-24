export type EpisodeStatus = 'upcoming' | 'unmonitored' | 'owned' | 'proposed' | 'wanted'

// An episode TMDB has not dated yet is upcoming, and a file seen on Plex wins over every other state
export const episodeStatus = (
  episode: { air_date?: string | Date | null, monitored?: boolean, files?: any[], release?: string | null },
  now: Date | number = Date.now(),
): EpisodeStatus => {
  if (episode.files?.length) {
    return 'owned'
  }

  if (!episode.air_date || new Date(episode.air_date).getTime() > new Date(now).getTime()) {
    return 'upcoming'
  }

  if (!episode.monitored) {
    return 'unmonitored'
  }

  return episode.release ? 'proposed' : 'wanted'
}
