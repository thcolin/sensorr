import React, { PureComponent } from 'react'
import Details, { Tabs, withCount } from 'views/layout/Details'
import * as Persona from 'components/Entity/Persona'
import Film from 'components/Entity/Film'
import theme from 'theme'

export default class Star extends PureComponent {
  static placeholder = {
    birthday: '1963-03-27',
    known_for_department: 'Directing',
    deathday: null,
    id: 138,
    name: 'Quentin Tarantino',
    also_known_as: [],
    images: { profiles: [] },
    gender: 2,
    biography: "Quentin Tarantino, né le 27 mars 1963 à Knoxville dans le Tennessee, est un réalisateur, scénariste, producteur et acteur américain. Il se fait connaître en tant que réalisateur de films indépendants avec ses deux premiers films, Reservoir Dogs (1992) et Pulp Fiction (1994) et remporte pour ce dernier la Palme d'or à Cannes. Après un troisième film en 1997 (Jackie Brown), il effectue son retour avec les deux volets de Kill Bill (2003 et 2004). Inglourious Basterds (2009) et Django Unchained (2012) sont ses plus grands succès commerciaux internationaux. Son deuxième western, Les Huit Salopards, est sorti en fin 2015.",
    popularity: 11.058,
    place_of_birth: 'Knoxville, Tennessee, USA',
    profile_path: false,
    adult: false,
    imdb_id: 'nm0000233',
    homepage: null,
    movie_credits: {
      cast: [],
      crew: [],
    }
  }

  static tabs = {
    sorts: {
      vote_average: {
        name: 'Vote Average',
        emoji: '💯',
        sort: (a, b) => (b.vote_average - (500 / b.vote_count)) - (a.vote_average - (500 / a.vote_count)),
      },
      release_date: {
        name: 'Release Date',
        emoji: '📆',
        sort: (a, b) => new Date(b.release_date || null) - new Date(a.release_date || null),
      },
      popularity: {
        name: 'Popularity',
        emoji: '📣',
        sort: (a, b) => b.popularity - a.popularity,
      },
    },
    subtitles: {
      cast: withCount(({ details, source, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{source.length}</strong> movies in your library &nbsp;
          </span>
          <label htmlFor="subtitles.cast">
            <span>
              {Star.tabs.sorts[state.order || 'vote_average'].emoji}&nbsp; Currently sorted by <strong>{Star.tabs.sorts[state.order || 'vote_average'].name}</strong>
            </span>
            <select
              id="subtitles.cast"
              value={state.order}
              onChange={e => setState({ ...state, order: e.target.value, sort: Star.tabs.sorts[e.target.value].sort })}
            >
              {Object.keys(Star.tabs.sorts).map(key => (
                <option value={key} key={key}>
                  {Star.tabs.sorts[key].emoji}&nbsp; Sort by {Star.tabs.sorts[key].name}
                </option>
              ))}
            </select>
          </label>
        </>
      ), 'movies'),
      crew: withCount(({ details, source, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{source.length}</strong> movies in your library &nbsp;
          </span>
          <label htmlFor="subtitles.crew">
            <span>
              {Star.tabs.sorts[state.order || 'vote_average'].emoji}&nbsp; Currently sorted by <strong>{Star.tabs.sorts[state.order || 'vote_average'].name}</strong>
            </span>
            <select
              id="subtitles.crew"
              value={state.order}
              onChange={e => setState({ ...state, order: e.target.value, sort: Star.tabs.sorts[e.target.value].sort })}
            >
              {Object.keys(Star.tabs.sorts).map(key => (
                <option value={key} key={key}>
                  {Star.tabs.sorts[key].emoji}&nbsp; Sort by {Star.tabs.sorts[key].name}
                </option>
              ))}
            </select>
          </label>
          {details.known_for_department !== 'Acting' && (
            <>
              <span>&nbsp;and&nbsp;</span>
              <button
                css={theme.resets.button}
                onClick={() => setState({
                  ...state,
                  strict: !state.strict,
                  filter: state.strict ? () => true : credit => (
                    credit.department === details.known_for_department ||
                    details.known_for_department === 'Acting'
                  )
                })}
              >
                showing 💼 <strong>{state.strict ? details.known_for_department : 'All'}</strong> departement(s) credits
              </button>
            </>
          )}
        </>
      ), 'movies'),
    }
  }

  static components = {
    Title: ({ details }) => details.name || '',
    Poster: ({ details, ...props }) => (
      <Persona.Poster
        entity={details}
        title={null}
        display="portrait"
        withState={false}
        link={null}
        {...(Star.generators.poster(details) ? {
          img: Star.generators.poster(details),
        } : {})}
        {...props}
      />
    ),
    State: ({ details }) => (
      <Persona.State entity={details} compact={false} css={{ alignSelf: 'flex-start', margin: 0 }} />
    ),
    Metadata: ({ details }) => (
      <>
        {!!details.known_for_department && (
          <span key="known_for_department">
            💼 &nbsp;<strong>{details.known_for_department}</strong>
          </span>
        )}
        {!!details.place_of_birth && (
          <span key="place_of_birth">
            🏡 &nbsp;<strong>{details.place_of_birth}</strong>
          </span>
        )}
        {!!details.birthday && (
          <span key="birthday">
            🎂 &nbsp;<strong>{new Date(details.birthday).toLocaleDateString()}</strong>
            {!details.deathday && (
              <small> &nbsp; {(details.deathday ? new Date(details.deathday) : new Date()).getFullYear() - new Date(details.birthday).getFullYear()} years old</small>
            )}
          </span>
        )}
        {!!details.deathday && (
          <span key="deathday">
            🥀 &nbsp;<strong>{new Date(details.deathday).toLocaleDateString()}</strong>
            <small> &nbsp; {(details.deathday ? new Date(details.deathday) : new Date()).getFullYear() - new Date(details.birthday).getFullYear()} years old</small>
          </span>
        )}
      </>
    ),
    Description: ({ details }) => details.biography || '',
    Tabs: ({ details, ready, palette, ...props }) => (
      <Tabs
        {...props}
        id="star-tabs"
        details={details}
        ready={ready}
        palette={palette}
        initial={details.known_for_department === 'Acting' ? 'cast' : 'crew'}
        items={[
          [
            ...(!details.movie_credits.cast.length && ready ? [] : [
              {
                label: '👩‍🎤️  Casting',
                key: 'cast',
                state: {
                  order: 'vote_average',
                  sort: Star.tabs.sorts.vote_average.sort,
                },
                props: {
                  source: details.movie_credits.cast
                    .map((credit, index, self) => ({
                      ...credit,
                      ...(!credit.job ? {} : {
                        job: self.filter(c => c.id === credit.id).map(c => c.job).join(', '),
                      }),
                    }))
                    .filter((a, index, self) => index === self.findIndex(b => a.id === b.id))
                    .map(credit => ({ ...credit, credits: [{ ...credit, ...details }] })),
                  child: Film,
                  props: ({ index }) => ({ display: index < 5 ? 'pretty' : 'default', palette, withCredits: true }),
                  subtitle: Star.tabs.subtitles.cast,
                },
              }
            ]),
          ],
          [
            ...(!details.movie_credits.crew.length && ready ? [] : [
              {
                label: '🎬  Crew',
                key: 'crew',
                state: {
                  order: 'vote_average',
                  sort: Star.tabs.sorts.vote_average.sort,
                  strict: true,
                  filter: (credit) => (
                    credit.department === details.known_for_department ||
                    details.known_for_department === 'Acting'
                  ),
                },
                props: {
                  source: details.movie_credits.crew
                    .map((credit, index, self) => ({
                      ...credit,
                      ...(!credit.job ? {} : {
                        job: self.filter(c => c.id === credit.id).map(c => c.job).join(', '),
                      }),
                    }))
                    .filter((a, index, self) => index === self.findIndex(b => a.id === b.id))
                    .map(credit => ({ ...credit, credits: [{ ...credit, ...details }] })),
                  child: Film,
                  props: ({ index }) => ({ display: index < 5 ? 'pretty' : 'default', palette, withCredits: true }),
                  subtitle: Star.tabs.subtitles.crew,
                },
              }
            ])
          ],
        ]}
      />
    )
  }

  static generators = {
    title: (details) => `Sensorr - ${details.name}`,
    poster: (details, context = 'default') => {
      if (!details.profile_path) {
        return null
      }

      return `https://image.tmdb.org/t/p/${{
        palette: 'w45',
      }[context] || 'h632'}${details.profile_path}`
    },
    background: (details, context = 'default') => {
      if (!details.images.profiles.length && !details.profile_path) {
        return null
      }

      if (context === 'trailer') {
        return null
      }

      return `https://image.tmdb.org/t/p/${{
      }[context] || 'original'}${(
        [...details.images.profiles].sort((a, b) => a.aspect_ratio > b.aspect_ratio).pop() ||
        { file_path: details.profile_path }
      ).file_path}`
    },
  }

  static palette = {
    backgroundColor: theme.colors.rangoon,
    color: '#ffffff',
    alternativeColor: '#ffffff',
    negativeColor: '#ffffff',
  }

  render() {
    const { match } = this.props

    return (
      <Details
        uri={['person', match.params.id]}
        params={{ append_to_response: 'images,movie_credits' }}
        placeholder={Star.placeholder}
        components={Star.components}
        generators={Star.generators}
        palette={Star.palette}
      />
    )
  }
}
