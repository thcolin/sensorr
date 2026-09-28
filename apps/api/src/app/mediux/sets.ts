// Read from the GraphQL schema AURA queries (mediux-team/AURA, backend/mediux/*.graphql): MediUX does not document it
const SETS = {
  movie: `query ($id: ID!) {
    item: movies_by_id(id: $id) {
      sets: movie_sets(filter: { _or: [{ movie_poster: { id: { _neq: null } } }, { movie_backdrop: { id: { _neq: null } } }] }) {
        id set_title user_created { username }
        poster: movie_poster { id modified_on }
        backdrop: movie_backdrop { id modified_on }
      }
    }
  }`,
  tv: `query ($id: ID!) {
    item: shows_by_id(id: $id) {
      sets: show_sets(filter: { _or: [{ show_poster: { id: { _nnull: true } } }, { show_backdrop: { id: { _nnull: true } } }] }) {
        id set_title user_created { username }
        poster: show_poster { id modified_on }
        backdrop: show_backdrop { id modified_on }
      }
    }
  }`,
}

export type MediuxType = keyof typeof SETS

export interface MediuxImage {
  thumb: string
  url: string
}

export interface MediuxSet {
  id: string
  title: string
  author: string | null
  poster: MediuxImage | null
  backdrop: MediuxImage | null
}

export const typeOf = (value: unknown): MediuxType | null => value === 'movie' || value === 'tv' ? value : null

export const queryOf = (type: MediuxType, id: number) => ({ query: SETS[type], variables: { id: `${id}` } })

// The JPEG MediUX makes for Plex: the original is a PNG of several megabytes
const imageOf = (asset): MediuxImage | null => {
  const image = [].concat(asset || [])[0]

  if (!image?.id) {
    return null
  }

  const modified = new Date(image.modified_on)
  const v = Number.isNaN(modified.getTime()) ? '' : `v=${modified.toISOString().replace(/\D/g, '').slice(0, 14)}&`
  const base = `https://images.mediux.io/assets/${encodeURIComponent(image.id)}?${v}`
  return { thumb: `${base}key=thumb`, url: `${base}key=jpg` }
}

export const setsOf = (data): MediuxSet[] => (data?.item?.sets || []).map((set) => ({
  id: `${set.id}`,
  title: set.set_title || '',
  author: set.user_created?.username || null,
  poster: imageOf(set.poster),
  backdrop: imageOf(set.backdrop),
})).filter(({ poster, backdrop }) => poster || backdrop)
