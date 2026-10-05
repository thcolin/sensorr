export const isOldGuid = (guid) => guid.startsWith('com.plexapp.agents.')

// The ids an old Plex agent kept in its guid, `com.plexapp.agents.imdb://tt0351283?lang=fr`, as the new agent lists them
export const idsOf = (guid) => {
  const [, agent, id] = guid.match(/^com\.plexapp\.agents\.(imdb|themoviedb):\/\/([^?]+)/) || []
  return agent ? [`${agent === 'imdb' ? 'imdb' : 'tmdb'}://${id}`] : []
}

// The new agent still lists the ids of an old guid
export const sameMovieOf = (guid, metadata) => metadata.guid === guid || idsOf(guid).some((id) => (metadata.guids || []).includes(id))

// A movie gone from Plex, described by TMDB from the ids its old guid kept, in the shape of Plex metadata
export const tmdbOf = async (tmdb, guid) => {
  const [id] = idsOf(guid)

  if (!id) {
    return {}
  }

  const tmdb_id = id.startsWith('tmdb://')
    ? id.replace('tmdb://', '')
    : (await tmdb.fetch(`find/${id.replace('imdb://', '')}`, { external_source: 'imdb_id' })).movie_results?.[0]?.id

  if (!tmdb_id) {
    return {}
  }

  const movie = await tmdb.fetch(`movie/${tmdb_id}`, { append_to_response: 'credits' })
  return {
    title: movie.title,
    year: Number(movie.release_date?.slice(0, 4)) || undefined,
    genres: (movie.genres || []).map(({ name }) => name),
    directors: (movie.credits?.crew || []).filter(({ job }) => job === 'Director').map(({ name }) => name),
    actors: (movie.credits?.cast || []).slice(0, 5).map(({ name }) => name),
    guids: [`tmdb://${movie.id}`],
    thumb: movie.poster_path || undefined,
    art: movie.backdrop_path || undefined,
    duration: movie.runtime ? movie.runtime * 60000 : undefined,
  }
}
