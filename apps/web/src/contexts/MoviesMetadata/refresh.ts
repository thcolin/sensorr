// TMDB drops a movie now and then, a duplicate merged into another one among them: a movie Sensorr stores with its
// title is written without its refresh then, so that its proposal can still be answered. Without a title, a new
// movie, a ban-only one or one just ignored, TMDB is all it could be written from
export const refresh = async (tmdb: { fetch: (uri: string, params?: any) => Promise<any> }, id: string | number, current?: { title?: string }) => {
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
    if (!current?.title) {
      throw err
    }

    console.warn(err)
    return {}
  }
}
