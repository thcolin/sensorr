export const bansOf = (movie) => [...new Set([
  ...(movie.banned_releases || []),
  ...(movie.releases || []).filter(({ proposal }) => !proposal).flatMap(({ original, title }) => [original, title]),
].filter(Boolean))]

// A proposal waiting for a decision, or an accepted swap still on its way, is already a replacement.
export const isBusy = (movie) => (movie.releases || []).some(({ proposal, replaces }) => proposal || replaces?.length)

// The first run only sets the cursor: reports made before the job was turned on are not replayed.
export const newReportsOf = (reports, { server, since }) => since ? reports.filter((report) => report.server === server && report.date > since) : []

export const cursorOf = (reports, since) => Math.max(since || Date.now(), ...reports.map(({ date }) => date))

export const movieOf = (payload, library) => {
  const guids = (payload?.Guid || []).map(({ id }) => id.split('://')).reduce((acc, [agent, id]) => ({ ...acc, [agent]: id }), {})

  if (payload?.type !== 'movie') {
    return null
  }

  return (guids.tmdb && library.find((movie) => `${movie.id}` === guids.tmdb)) ||
    (guids.imdb && library.find((movie) => movie.imdb_id === guids.imdb)) ||
    null
}

export const reportedOf = (movie, { id, message, date, username }) => (movie.reports || []).some((report) => report.id === id) ? movie : {
  ...movie,
  banned_releases: bansOf(movie),
  reports: [...(movie.reports || []), { id, message, date, username }],
}

// `reported_at` is stamped once the movie has been searched, so a search that failed is tried again.
export const isPending = (movie) => Math.max(0, ...(movie.reports || []).map(({ date }) => date)) > (movie.reported_at || 0)

export const replacesOf = (movie) => (movie.releases || []).filter(({ from }) => from === 'sync').map(({ id }) => id)
