// A report names the movie, not one of its versions: every owned release gets banned.
export const bansOf = (movie) => [...new Set([
  ...(movie.banned_releases || []),
  ...(movie.releases || []).filter(({ proposal }) => !proposal).flatMap(({ original, title }) => [original, title]),
].filter(Boolean))]

// A proposal waiting for a decision, or an accepted swap still on its way, is already a replacement.
export const isBusy = (movie) => (movie.releases || []).some(({ proposal, replaces }) => proposal || replaces?.length)

// The first run only sets the cursor: reports made before the job was turned on are not replayed.
export const newReportsOf = (reports, { server, since }) => since ? reports.filter((report) => report.server === server && report.date > since) : []

export const cursorOf = (reports, since) => Math.max(since || Date.now(), ...reports.map(({ date }) => date))
