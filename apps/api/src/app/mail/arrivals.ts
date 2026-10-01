import type { Arrival } from './templates'

const POSTER = 'https://image.tmdb.org/t/p/w342'

interface Movie { title: string, release_date?: string | Date, poster_path?: string, archived_at: number }
interface Show { _id: number, name: string, poster_path?: string }
interface Episode { show_id: number, season_number: number, files_at: number }

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

export const arrivalsOf = ({ movies, shows, episodes }: { movies: Movie[], shows: Show[], episodes: Episode[] }): Arrival[] => {
  const landed = shows
    .map((show) => {
      const own = episodes.filter(({ show_id }) => show_id === show._id)
      const seasons = [...new Set(own.map(({ season_number }) => season_number))]
      return own.length && {
        at: Math.max(...own.map(({ files_at }) => files_at)),
        title: show.name,
        detail: seasons.length === 1 ? `Season ${seasons[0]}, ${plural(own.length, 'episode')}` : plural(own.length, 'episode'),
        poster: show.poster_path ? `${POSTER}${show.poster_path}` : undefined,
      }
    })
    .filter(Boolean)

  return [
    ...movies.map((movie) => ({
      at: movie.archived_at,
      title: movie.title,
      detail: movie.release_date ? String(new Date(movie.release_date).getFullYear()) : 'Movie',
      poster: movie.poster_path ? `${POSTER}${movie.poster_path}` : undefined,
    })),
    ...landed,
  ]
    .sort((a, b) => b.at - a.at)
    .map(({ at, ...arrival }) => arrival)
}
