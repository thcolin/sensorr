import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import Button from 'components/Button'
import Details, { Tabs, withCount } from 'views/layout/Details'
import Releases from './blocks/Releases'
import Person from 'components/Entity/Person'
import * as MovieEntity from 'components/Entity/Movie'
import Documents from 'shared/Documents'
import countryLanguage from 'country-language'
import uuidv4 from 'uuid/v4'
import theme from 'theme'

export default class Movie extends PureComponent {
  static placeholder = {
    adult: false,
    backdrop_path: false,
    belongs_to_collection: null,
    budget: 159000000,
    genres: [
      {
        id: 80,
        name: 'Crime'
      },
      {
        id: 36,
        name: 'Histoire'
      },
      {
        id: 18,
        name: 'Drame'
      }
    ],
    homepage: 'https://www.netflix.com/fr/title/80175798',
    id: 0,
    imdb_id: 'tt1302006',
    original_language: 'en',
    original_title: 'The Irishman',
    overview: 'Cette saga sur le crime organisé dans l\'Amérique de l\'après-guerre est racontée du point de vue de Frank Sheeran, un ancien soldat de la Seconde Guerre mondiale devenu escroc et tueur à gages ayant travaillé aux côtés de quelques-unes des plus grandes figures du 20e siècle. Couvrant plusieurs décennies, le film relate l\'un des mystères insondables de l\'histoire des États-Unis : la disparition du légendaire dirigeant syndicaliste Jimmy Hoffa. Il offre également une plongée monumentale dans les arcanes de la mafia en révélant ses rouages, ses luttes internes et ses liens avec le monde politique.',
    popularity: 113.763,
    poster_path: false,
    production_companies: [],
    production_countries: [],
    release_date: '2019-11-01',
    revenue: 607420,
    runtime: 209,
    spoken_languages: [],
    status: 'Released',
    tagline: 'Son histoire a changé l\'histoire.',
    title: 'The Irishman',
    video: false,
    vote_average: 8.3,
    vote_count: 455,
    videos: {
      results: [],
    },
    credits: {
      cast: [],
      crew: [],
    },
    similar: {
      page: 1,
      results: [],
      total_pages: 13,
      total_results: 253
    },
    recommendations: {
      page: 1,
      results: [],
      total_pages: 2,
      total_results: 40
    },
    alternative_titles: {
      titles: [
        {
          iso_3166_1: 'US',
          title: 'I Heard You Paint Houses',
          type: 'Working title'
        }
      ]
    },
    release_dates: {
      results: [
        {
          iso_3166_1: 'SG',
          release_dates: [
            {
              certification: 'M18',
              iso_639_1: '',
              note: 'Netflix',
              release_date: '2019-11-27T00:00:00.000Z',
              type: 4
            }
          ]
        },
      ]
    },
    keywords: {
      keywords: [],
    },
  }

  static tabs = {
    subtitles: {
      collection: withCount(({ details, entities, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{entities.length}</strong> movies from <Link to={`/collection/${details.belongs_to_collection?.id}`} style={{ color: 'inherit' }}>"{details.belongs_to_collection?.name}"</Link> in your library
          </span>
        </>
      ), 'movies'),
      recommendations: withCount(({ details, entities, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{entities.length}</strong> recommended movies in your library
          </span>
        </>
      ), 'movies'),
      similar: withCount(({ details, entities, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{entities.length}</strong> similar movies in your library
          </span>
        </>
      ), 'movies'),
      cast: withCount(({ details, entities, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{entities.length}</strong> followed stars
          </span>
          <button css={theme.resets.button}
            onClick={() => setState({
              limit: !state.limit,
              filter: state.limit ? () => true : (credit, index) => index < 20,
            })}
          >
            {{ true: '📗', false: '📚' }[state.limit]}&nbsp; Showing <strong>{{ true: '20 first', false: 'All' }[state.limit]}</strong> credits
          </button>
        </>
      ), 'stars'),
      crew: withCount(({ details, entities, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{entities.length}</strong> followed crew members
          </span>
          <button css={theme.resets.button}
            onClick={() => setState({
              limit: !state.limit,
              filter: state.limit ? () => true : (credit, index) => index < 20,
            })}
          >
            {{ true: '📗', false: '📚' }[state.limit]}&nbsp; Showing <strong>{{ true: '20 first', false: 'All' }[state.limit]}</strong> credits
          </button>
        </>
      ), 'stars'),
    }
  }

  static components = {
    Title: ({ details }) => details.title || '',
    Caption: ({ details }) => (
      <>
        {details.title !== details.original_title && (
          <span>
            {details.original_title}
          </span>
        )}
        {details.title !== details.original_title && details.release_date && (
          <span> </span>
        )}
        {details.release_date && (
          <Link
            title={new Date(details.release_date).toLocaleDateString()}
            to={{
              pathname: '/movies/discover',
              state: {
                controls: {
                  filtering: {
                    release_date: [
                      new Date(details.release_date).getFullYear(),
                      new Date(details.release_date).getFullYear(),
                    ],
                  },
                },
              },
            }}
            css={theme.resets.a}
          >
            ({new Date(details.release_date).getFullYear()})
          </Link>
        )}
      </>
    ),
    Poster: ({ details, ...props }) => (
      <MovieEntity.Poster
        entity={details}
        title={null}
        withState={false}
        link={null}
        {...(Movie.generators.poster(details) ? {
          img: Movie.generators.poster(details),
        } : {})}
        {...props}
      />
    ),
    State: ({ details }) => (
      <MovieEntity.State entity={details} compact={false} css={{ alignSelf: 'flex-start', margin: '0 0 0 1rem' }} />
    ),
    Metadata: ({ details }) => (
      <>
        {!!details.credits.crew.filter(star => star.job === 'Director').length && (
          <span>
            🎥 &nbsp;{details.credits.crew.filter(star => star.job === 'Director').map((star, index, arr) => (
              <span key={star.id}>
                <Link
                  to={{
                    pathname: '/movies/discover',
                    state: {
                      controls: {
                        filtering: {
                          with_crew: [{ value: star.id, label: star.name }],
                        },
                      },
                    },
                  }}
                  css={theme.resets.a}
                >
                  {star.name}
                </Link>
                {index === arr.length - 1 ? '' : ', '}
              </span>
            ))}
          </span>
        )}
        {!!details.runtime && (
          <span>
            <Link
              to={{
                pathname: '/movies/discover',
                state: {
                  controls: {
                    filtering: {
                      runtime: [
                        Math.floor(details.runtime / 60) * 60,
                        Math.ceil(details.runtime / 60) * 60,
                      ],
                    },
                  },
                },
              }}
              css={theme.resets.a}
            >
              🕙 &nbsp;<strong>{new Documents.Movie(details).duration()}</strong>
            </Link>
          </span>
        )}
        {!!details.genres.length && (
          <span>
            🎟️ &nbsp;{details.genres.map((genre, index, arr) => (
              <span key={genre.id}>
                <Link
                  to={{
                    pathname: '/movies/discover',
                    state: {
                      controls: {
                        filtering: {
                          with_genres: [{ value: genre.id, label: genre.name }],
                        },
                      },
                    },
                  }}
                  css={theme.resets.a}
                >
                  {genre.name}
                </Link>
                {index === arr.length - 1 ? '' : ', '}
              </span>
            ))}
          </span>
        )}
        {typeof details.vote_average !== 'undefined' && (
          <span>
            <Link
              to={{
                pathname: '/movies/discover',
                state: {
                  controls: {
                    filtering: {
                      vote_average: [
                        details.vote_average.toFixed(0) - 1,
                        details.vote_average.toFixed(0),
                      ],
                    },
                  },
                },
              }}
              css={theme.resets.a}
            >
              {new Documents.Movie(details).judge()} &nbsp;<strong>{details.vote_average.toFixed(1)}</strong>
            </Link>
          </span>
        )}
      </>
    ),
    Subdata: ({ details }) => (
      <>
        {!!details.original_language && (
          <div>
            💬 &nbsp;
            <span>
              <Link
                to={{
                  pathname: '/movies/discover',
                  state: {
                    controls: {
                      filtering: {
                        with_original_language: [
                          {
                            value: details.original_language,
                            label: countryLanguage.getLanguage(details.original_language).name[0],
                          },
                        ],
                      },
                    },
                  },
                }}
                css={theme.resets.a}
              >
                {countryLanguage.getLanguage(details.original_language).name[0]}
              </Link>
            </span>
          </div>
        )}
        {!!details.production_companies.length && (
          <div>
            🏛️ &nbsp;{details.production_companies.map((company, index, arr) => (
              <span key={company.id}>
                <Link
                  key={company.id}
                  to={{
                    pathname: '/movies/discover',
                    state: {
                      controls: {
                        filtering: {
                          with_companies: [{ value: company.id, label: company.name }],
                        },
                      },
                    },
                  }}
                  css={theme.resets.a}
                >
                  {company.name}
                </Link>
                {index === arr.length - 1 ? '' : ', '}
              </span>
            ))}
          </div>
        )}
        {!!details.keywords.keywords.length && (
          <div>
            🔗 &nbsp;{details.keywords.keywords.map((keyword, index, arr) => (
              <span key={keyword.id}>
                <Link
                  to={{
                    pathname: '/movies/discover',
                    state: {
                      controls: {
                        filtering: {
                          with_keywords: [{ value: keyword.id, label: keyword.name }],
                        },
                      },
                    },
                  }}
                  css={theme.resets.a}
                >
                  {keyword.name}
                </Link>
                {index === arr.length - 1 ? '' : ', '}
              </span>
            ))}
          </div>
        )}
      </>
    ),
    Tagline: ({ details }) => details.tagline || '',
    Description: ({ details }) => details.overview || '',
    Tabs: ({ details, ready, palette, ...props }) => (
      <Tabs
        {...props}
        id="movie-tabs"
        details={details}
        ready={ready}
        palette={palette}
        initial={(
          (!!(details.belongs_to_collection || { parts: [] }).parts.length && 'collection') ||
          (!!details.recommendations.results.length && 'recommendations') ||
          (!!details.similar.results.length && 'similar') ||
          (!!details.credits.cast.length && 'cast') ||
          (!!details.credits.crew.length && 'crew') ||
          'collection'
        )}
        items={[
          [
            ...(!(details.belongs_to_collection || { parts: [] }).parts.length && ready ? [] : [
              {
                label: `📀  ${(details.belongs_to_collection || {}).name}`,
                key: 'collection',
                state: {},
                props: {
                  entities: (details.belongs_to_collection || { parts: [] }).parts,
                  child: MovieEntity.default,
                  props: { display: 'pretty', palette },
                  subtitle: Movie.tabs.subtitles.collection,
                  more: {
                    pathname: `/collection/${details.belongs_to_collection?.id}`,
                  },
                },
              }
            ]),
            ...(!details.recommendations.results.length && ready ? [] : [
              {
                label: '💬  Recommendations',
                key: 'recommendations',
                state: {},
                props: {
                  entities: details.recommendations.results,
                  child: MovieEntity.default,
                  props: ({ index }) => ({ display: index < 5 ? 'pretty' : 'default', palette }),
                  subtitle: Movie.tabs.subtitles.recommendations,
                  more: {
                    pathname: `/movie/${details.id}/recommendations`,
                  },
                },
              }
            ]),
            ...(!details.similar.results.length && ready ? [] : [
              {
                label: '👯  Similar',
                key: 'similar',
                state: {},
                props: {
                  entities: details.similar.results,
                  child: MovieEntity.default,
                  props: ({ index }) => ({ display: index < 5 ? 'pretty' : 'default', palette }),
                  subtitle: Movie.tabs.subtitles.similar,
                  more: {
                    pathname: `/movie/${details.id}/similar`,
                  },
                },
              }
            ]),
          ],
          [
            ...(!details.credits.cast.length && ready ? [] : [
              {
                label: '👩‍🎤️  Casting',
                key: 'cast',
                state: {
                  limit: true,
                  filter: (credit, index) => index < 20,
                },
                props: {
                  entities: details.credits.cast,
                  child: Person,
                  props: { display: 'portrait', palette },
                  subtitle: Movie.tabs.subtitles.cast,
                },
              }
            ]),
            ...(!details.credits.crew.length && ready ? [] : [
              {
                label: '🎬  Crew',
                key: 'crew',
                state: {
                  limit: true,
                  filter: (credit, index) => index < 20,
                },
                props: {
                  entities: [...details.credits.crew]
                    .sort((a, b) => ({ Director: 2, Writor: 1 }[b.job] || 0) - ({ Director: 2, Writor: 1 }[a.job] || 0))
                    .map((credit, index, self) => ({
                      ...credit,
                      job: self.filter(c => c.id === credit.id).map(c => c.job).join(', '),
                    }))
                    .filter((a, index, self) => index === self.findIndex(b => a.id === b.id)),
                  child: Person,
                  props: { display: 'portrait', palette },
                  subtitle: Movie.tabs.subtitles.crew,
                },
              }
            ]),
          ]
        ]}
      />
    ),
    Button: ({ state, setState, palette }) => (
      <Button
        look={1}
        onClick={() => {
          setState({ releases: uuidv4() })
          setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 200)
        }}
        style={{
          position: 'relative',
          color: palette.color,
          borderColor: palette.color,
          textTransform: 'uppercase',
          borderWidth: '0.3em',
          margin: '1em',
          fontWeight: 800,
        }}
        data-test="movie-findReleases"
      >
        {state.releases ? 'Retry' : 'Find Releases'}
      </Button>
    ),
    Children: ({ details, state }) => state.releases ? (
      <Releases key={state.releases} movie={details} />
    ) : null
  }

  static generators = {
    title: (details, state) => `Sensorr - ${[
      details.title,
      (details.release_date && `(${new Date(details.release_date).getFullYear()})`),
      (!!state.releases && `- 🔍`),
    ].filter(string => string).join(' ')}`,
    subdata: (details) => !!(details.original_language || details.production_companies.length || details.keywords.keywords.length),
    tagline: (details) => !!details.tagline,
    poster: (details, context = 'default') => {
      if (!details.poster_path) {
        return null
      }

      return `https://image.tmdb.org/t/p/${{
        palette: 'w92',
      }[context] || 'w500'}${details.poster_path}`
    },
    background: (details, context = 'default') => {
      if (!details.backdrop_path) {
        return null
      }

      return `https://image.tmdb.org/t/p/${{
      }[context] || 'original'}${{
        background: (details.images.backdrops
          .filter(backdrop => backdrop.file_path !== details.backdrop_path)
          .sort((a, b) => a.vote_average - b.vote_average)
          .pop() || {}).file_path,
      }[context] || details.backdrop_path}`
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
        uri={['movie', match.params.id]}
        params={{
          append_to_response: 'images,videos,credits,similar,recommendations,alternative_titles,release_dates,keywords',
          include_image_language: 'en,null',
        }}
        placeholder={Movie.placeholder}
        components={Movie.components}
        generators={Movie.generators}
        palette={Movie.palette}
        usePalette={true}
      />
    )
  }
}
