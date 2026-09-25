import { memo } from 'react'
import { Icon } from '@sensorr/ui'
import { platformsOf } from './platforms'

const UIExternals = ({ entity, metadata, additional, meaningful, links = true }) => {
  const watch = (entity || {})['watch/providers']?.results[((global as any)?.config?.region || 'fr-FR').split('-')[1]]
  const platforms = platformsOf(watch?.flatrate)

  return (
    <div sx={UIExternals.styles.element}>
      {/* An empty group would still carry the margin that separates it from the next one */}
      {(!!meaningful?.vote_average || !!additional?.reviews?.length) && (
        <div>
          {meaningful?.vote_average && <meaningful.vote_average />}
          {(additional?.reviews || [])?.map(review => (
            <a
              href={review.external}
              target='_blank'
              rel='noreferrer noopener'
              key={review.source}
              sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
              title={{
                'Rotten Tomatoes': `Rotten Tomatoes Critic Rating from ${review.count} reviews`,
                'Metacritic': `Metascrore based on ${review.count} critic reviews`,
              }[review.source]}
            >
              <Icon
                value={{ 'Rotten Tomatoes': 'rottentomatoes', 'Metacritic': 'metacritic' }[review.source]}
                height={{ 'Rotten Tomatoes': '1em', 'Metacritic': '1.2em' }[review.source]}
                width={{ 'Rotten Tomatoes': '1em', 'Metacritic': '1.2em' }[review.source]}
                sx={{ marginRight: 8 }}
              />
              {Math.round(review.score * 100)}%
            </a>
          ))}
        </div>
      )}
      {(!!metadata?.plex_url || !!platforms.length) && (
        <div>
          {!!metadata?.plex_url && (
            <a
              href={metadata?.plex_url}
              target='_blank'
              rel='noopener noreferrer'
              sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
              title={`Available on your own Plex server`}
            >
              <span sx={{ display: 'flex', justifyContent: 'center', fontSize: '1.7em', width: '0.75em', color: 'plex' }}>
                ❯
              </span>
            </a>
          )}
          {platforms.map(([provider, ...offers]) => (
            <a
              href={watch?.link}
              target='_blank'
              rel='noreferrer noopener'
              key={provider.provider_id}
              sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
              title={`Available for streaming on ${new Intl.ListFormat('en').format([provider, ...offers].map(({ provider_name }) => `"${provider_name}"`))} (source JustWatch)`}
            >
              <img src={`https://image.tmdb.org/t/p/w92/${provider.logo_path}`} sx={{ height: '2em', width: '2em', borderRadius: '0.25em' }} />
            </a>
          ))}
        </div>
      )}
      {links && !!Object.keys(additional?.externals || {}).filter(key => !['rottentomatoes', 'metacritic'].includes(key)).length && (
        <div>
          {Object.keys(additional?.externals || {}).filter(key => !['rottentomatoes', 'metacritic'].includes(key)).map(external => (
            <a
              href={additional?.externals[external]}
              target='_blank'
              rel='noreferrer noopener'
              key={external}
              sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
              title={{
                letterbox: 'Letterboxd',
                senscritique: 'SensCritique',
                allocine: 'AlloCiné',
                imdb: 'IMDb',
                mubi: 'Mubi',
                plex: 'Plex',
              }[external]}
            >
              <Icon value={external as any} sx={{ height: '2em', width: '2em', borderRadius: '0.25em' }} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

UIExternals.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: ['column', 'row'],
    '>div': {
      display: 'flex',
      alignItems: 'center',
      ':not(:last-of-type)': {
        marginRight: [12, 0],
        marginBottom: [4, 12],
      },
      '>a': {
        marginRight: 6,
      },
    },
  },
}

export const Externals = memo(UIExternals)

const UIMeaningful = ({ meaningful, open, onToggle, aside = null }) => (
  <details sx={UIMeaningful.styles.element} onToggle={(e: any) => onToggle(e.target.open)} open={open}>
    <summary>
      <span />
      {
        (meaningful.directors && <meaningful.directors />) ||
        (meaningful.known_for_department && <meaningful.known_for_department />) ||
        (meaningful.release_dates_range && <meaningful.release_dates_range />)
      }
      {
        (meaningful.runtime && <meaningful.runtime />) ||
        (meaningful.age && <meaningful.age />)
      }
      {(meaningful.genres && <meaningful.genres />)}
      {aside && <span data-aside={true}>{aside}</span>}
    </summary>
    <div>
      {(
        (meaningful.release_date && <meaningful.release_date />) ||
        (meaningful.original_language && <meaningful.original_language />) ||
        (meaningful.place_of_birth && <meaningful.place_of_birth />) ||
        (meaningful.popularity && <meaningful.popularity />) ||
        (meaningful.vote_count && <meaningful.vote_count />) ||
        (meaningful.budget && <meaningful.budget />) ||
        (meaningful.revenue && <meaningful.revenue />)
      ) && (
        <span sx={{ '>*': { marginRight: 4 } }}>
          {(meaningful.release_date && <meaningful.release_date />)}
          {
            (meaningful.original_language && <meaningful.original_language />) ||
            (meaningful.place_of_birth && <meaningful.place_of_birth />)
          }
          {(meaningful.vote_count && <meaningful.vote_count />)}
          {(meaningful.popularity && <meaningful.popularity />)}
          {(meaningful.budget && <meaningful.budget />)}
          {(meaningful.revenue && <meaningful.revenue />)}
        </span>
      )}
      {
        (meaningful.production_companies && <meaningful.production_companies />) ||
        (meaningful.birthday && <meaningful.birthday />)
      }
      {
        (meaningful.keywords && <meaningful.keywords />) ||
        (meaningful.deathday && <meaningful.deathday />)
      }
    </div>
  </details>
)

UIMeaningful.styles = {
  element: {
    '>summary': {
      position: 'relative',
      lineHeight: 'space',
      '>*:first-child': {
        position: 'absolute',
        width: '1em',
        height: '100%',
        left: '0em',
        margin: '0em',
        cursor: 'pointer',
      },
      '>*': {
        fontWeight: 'semibold',
        whiteSpace: 'nowrap',
        marginX: 5,
      },
      '>[data-aside]': {
        display: 'inline-flex',
        alignItems: 'center',
        height: '2em',
        verticalAlign: 'top',
        fontWeight: 'normal',
        lineHeight: 1.15,
        marginLeft: 3,
      },
    },
    '>div': {
      marginTop: 5,
      '>*': {
        display: 'block',
        lineHeight: 'body',
        marginX: 5,
        marginBottom: 8,
      },
    },
  },
}

export const Meaningful = memo(UIMeaningful)
