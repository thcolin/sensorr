// TMDB drops a movie now and then, a duplicate merged into another one among them: a movie Sensorr already stores
// is written without its refresh then, so that its proposal can still be answered. A new one has nothing else to be
// written from
export const refresh = async (tmdb: { fetch: (uri: string, params?: any) => Promise<any> }, id: string | number, stored: boolean) => {
  try {
    const movie = await tmdb.fetch(`movie/${id}`, {
      append_to_response: 'alternative_titles,release_dates',
    })

    // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
    movie.release_dates.results = movie.release_dates.results
      .filter(({ type }) => type === 3)
      .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])

    return movie
  } catch (err) {
    if (!stored) {
      throw err
    }

    console.warn(err)
    return {}
  }
}
