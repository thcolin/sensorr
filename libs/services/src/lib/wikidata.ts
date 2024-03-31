export class WikiData {
  public query = {
    movies: {
      getMovieAdditionalData: ({
        query: (id) => `
          SELECT
            ?allocine
            ?letterbox
            ?metacritic
            ?rottentomatoes
            ?senscritique
            ?imdb
            ?plex
            ?mubi
            ?reviewSource
            ?reviewScore
            ?reviewDate
            ?reviewCount
          WHERE
          {
            ?movie wdt:P4947 "${id}".
            OPTIONAL { ?movie wdt:P1265 ?allocine . }
            OPTIONAL { ?movie wdt:P6127 ?letterbox . }
            OPTIONAL { ?movie wdt:P1712 ?metacritic . }
            OPTIONAL { ?movie wdt:P1258 ?rottentomatoes . }
            OPTIONAL { ?movie wdt:P10100 ?senscritique . }
            OPTIONAL { ?movie wdt:P345 ?imdb . }
            OPTIONAL { ?movie wdt:P11460 ?plex . }
            OPTIONAL { ?movie wdt:P7299 ?mubi . }
            OPTIONAL {
              ?movie p:P444 ?review .
              ?review pq:P447 ?_reviewOrigin ; ps:P444 ?reviewScore .
              ?review pq:P585 ?reviewDate .
              ?review pq:P7887 ?reviewCount .
              ?_reviewOrigin rdfs:label ?reviewSource filter(lang(?reviewSource) = 'en') .
            }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
          }
        `,
        transform: (body) => {
          const raw = (body?.results?.bindings || []).map(raw => Object.keys(raw).reduce((acc, key) => ({ ...acc, [key]: raw[key].value }), {}))

          return ({
            externals: {
              ...(raw[0]?.rottentomatoes ? { rottentomatoes: `https://www.rottentomatoes.com/${raw[0]?.rottentomatoes}` } : {}),
              ...(raw[0]?.metacritic ? { metacritic: `https://www.metacritic.com/${raw[0]?.metacritic}` } : {}),
              ...(raw[0]?.plex ? { plex: `https://app.plex.tv/desktop/#!/provider/tv.plex.provider.metadata/details?key=/library/metadata/${raw[0]?.plex}` } : {}),
              ...(raw[0]?.letterbox ? { letterbox: `https://letterboxd.com/film/${raw[0]?.letterbox}/` } : {}),
              ...(raw[0]?.senscritique ? { senscritique: `https://www.senscritique.com/film/-/${raw[0]?.senscritique}` } : {}),
              ...(raw[0]?.allocine ? { allocine: `https://www.allocine.fr/film/fichefilm_gen_cfilm=${raw[0]?.allocine}.html` } : {}),
              ...(raw[0]?.mubi ? { mubi: `https://mubi.com/films/${raw[0]?.mubi}` } : {}),
              ...(raw[0]?.imdb ? { imdb: `https://www.imdb.com/title/${raw[0]?.imdb}/` } : {}),
            },
            reviews: Object.values(raw
              .filter(({ reviewSource }) => ['Rotten Tomatoes', 'Metacritic'].includes(reviewSource))
              .map(({
                reviewSource: source,
                reviewDate: date,
                reviewCount: count,
                reviewScore: score,
              }) => ({
                external: {
                  'Rotten Tomatoes': `https://www.rottentomatoes.com/${raw[0]?.rottentomatoes}`,
                  'Metacritic': `https://www.metacritic.com/${raw[0]?.metacritic}`,
                }[source],
                source,
                date,
                count,
                score: Array(2)
                  .fill(true)
                  .map((_, i) => score.replace('%', '/100').split('/')[i] || '100')
                  .reduce((acc, curr) => acc ? (acc / curr) : curr),
              }))
              .reduce((acc, curr) => ({ ...acc, [curr.source]: curr }), {})),
          })
        }
      }),
    },
  }

  async fetch(query, transform, init?: any) {
    const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, {
      ...(init || {}),
      headers: {
        ...(init || {}).headers,
        Accept: 'application/sparql-results+json',
      },
    })

    if (!res.ok) {
      throw new Error(`[WikiData] ${res.status} (${res.statusText}): ${res.url}`)
    }

    const body = await res.json()
    return transform ? transform(body) : body
  }
}
