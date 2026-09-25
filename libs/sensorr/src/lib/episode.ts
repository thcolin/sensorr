export type EpisodeStatus = 'upcoming' | 'unmonitored' | 'owned' | 'proposed' | 'wanted'

export const episodeStatus = (
  episode: { air_date?: string | Date | null, monitored?: boolean, files?: any[], release?: string | null },
  now: Date | number = Date.now(),
): EpisodeStatus => {
  if (episode.files?.length) {
    return 'owned'
  }

  if (!episode.air_date) {
    return episode.monitored ? 'upcoming' : 'unmonitored'
  }

  if (new Date(episode.air_date).getTime() > new Date(now).getTime()) {
    return 'upcoming'
  }

  if (!episode.monitored) {
    return 'unmonitored'
  }

  return episode.release ? 'proposed' : 'wanted'
}

export const progressOf = (
  episodes: { air_date?: string | Date | null, files?: any[] }[],
  now: Date | number = Date.now(),
): { owned: number, aired: number } => episodes.reduce((acc, episode) => ({
  owned: acc.owned + (episode.files?.length ? 1 : 0),
  aired: acc.aired + ((episode.air_date && new Date(episode.air_date).getTime() <= new Date(now).getTime()) ? 1 : 0),
}), { owned: 0, aired: 0 })
