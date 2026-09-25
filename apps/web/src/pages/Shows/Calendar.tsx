import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EpisodeStatus, EpisodeStatusOptions, Empty, FilterReleaseDate, Link, Picture, Warning, withControls } from '@sensorr/ui'
import { episodeStatus } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useAPI, query as APIQuery } from '../../store/api'
import { useDeviceContext } from '../../contexts/Device/Device'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import { withBody } from '../../layout/withLayout'
import { day, groupByDay, monthRange } from './agenda'

const pad = (number) => String(number).padStart(2, '0')

const STATISTICS = {}

const withFollowedShows = () => (WrappedComponent) => {
  const withFollowedShows = ({ ...props }) => {
    const api = useAPI()
    const [shows, setShows] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
      const controller = new AbortController()
      const { uri, params, init } = APIQuery.shows.getShows({ params: { monitored: true, fields: 'id|name|poster_path', limit: '' }, init: { signal: controller.signal } })

      api.fetch(uri, params, init)
        .then(({ results }) => setShows(results.reduce((acc, show) => ({ ...acc, [show.id]: show }), {})))
        .catch(error => error.name !== 'AbortError' && setError(error))

      return () => controller.abort()
    }, [])

    const ids = useMemo(() => Object.keys(shows || {}), [shows])

    return (
      <WrappedComponent
        {...props}
        shows={shows || {}}
        query={{ uri: 'episodes', params: { show: ids.join('|') } }}
        ready={!!shows}
        error={error || ((shows && !ids.length) ? {
          emoji: '📺',
          title: 'Try to follow some shows first',
          subtitle: 'The calendar lists the episodes of the shows you follow, follow one from its page or from your library',
        } : null)}
      />
    )
  }

  withFollowedShows.displayName = `withFollowedShows(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withFollowedShows
}

const UIAgenda = ({ entities, shows, ready, error, controls, ...props }) => {
  const { i18n } = useTranslation()
  const { device } = useDeviceContext()
  const month = controls?.values?.air_date

  const days = useMemo(() => groupByDay(Object.values(entities || {}), shows), [entities, shows])

  useEffect(() => {
    if (error && !error.subtitle) {
      console.warn(error)
    }
  }, [error])

  if (error) {
    return (
      <Warning
        emoji={error.emoji || '💢'}
        title={error.title || 'Sorry, unable to display episodes...'}
        subtitle={error.subtitle || 'The API did not answer the episodes request, try again or log in again'}
      />
    )
  }

  if (!ready) {
    return (
      <Warning
        emoji='⌛'
        title='Loading episodes'
        subtitle='Please wait a few moments...'
      />
    )
  }

  if (!days.length) {
    return (
      <Warning
        emoji='📅'
        title='No episode this month'
        subtitle={`None of the shows you follow airs an episode in ${month ? month.toLocaleString(i18n.language, { month: 'long', year: 'numeric' }) : 'this month'}`}
      />
    )
  }

  const today = day(new Date())

  return (
    <section sx={UIAgenda.styles.element} aria-label='Episodes by day'>
      <div>
        {days.map(({ key, date, episodes }) => (
          <section key={key} sx={UIAgenda.styles.day} aria-labelledby={`day-${key}`}>
            <h5 id={`day-${key}`} sx={UIAgenda.styles.head}>
              <time dateTime={key}>{date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</time>
              {key === today && <small>Today</small>}
            </h5>
            <ul sx={UIAgenda.styles.list}>
              {episodes.map(episode => (
                <li key={episode.id}>
                  <Line episode={episode} show={shows[episode.show_id]} compact={device === 'mobile'} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}

UIAgenda.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    paddingX: [4, '5em'],
    marginY: 4,
    '>div': {
      width: '100%',
      maxWidth: '60em',
    },
  },
  day: {
    ':not(:first-of-type)': {
      marginTop: 4,
    },
  },
  head: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    margin: 12,
    paddingX: 8,
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    '>small': {
      fontSize: 6,
      fontWeight: 'semibold',
      color: 'grayDarkest',
    },
  },
  list: {
    listStyleType: 'none',
    margin: 12,
    padding: 12,
    '>li:not(:last-of-type)': {
      borderBottom: '1px solid',
      borderColor: 'gray',
    },
  },
}

const Agenda = memo(UIAgenda)

const UILine = ({ episode, show, compact }) => {
  const code = `S${pad(episode.season_number)}E${pad(episode.episode_number)}`
  const name = show?.name || `Show ${episode.show_id}`
  const status = episodeStatus(episode)

  return (
    <Link
      to={`/tv/${episode.show_id}`}
      sx={UILine.styles.element}
      aria-label={[`${name} ${code}`, episode.name, EpisodeStatusOptions[status]?.label].filter(Boolean).join(', ')}
    >
      <span sx={UILine.styles.poster}>
        <Picture path={show?.poster_path} size='w92' empty={Empty.tv} />
      </span>
      <span sx={UILine.styles.body}>
        <strong title={name}>{name}</strong>
        <span>
          <code>{code}</code>
          {!!episode.name && <span title={episode.name}>{episode.name}</span>}
        </span>
      </span>
      <EpisodeStatus value={status} size='small' compact={compact} />
    </Link>
  )
}

UILine.styles = {
  element: {
    variant: 'link.reset',
    display: 'flex',
    alignItems: 'center',
    gap: [6, 4],
    paddingX: 8,
    paddingY: 8,
    color: 'text',
    borderRadius: '0.25em',
    transition: 'background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLighter',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '-1px',
    },
  },
  poster: {
    flexShrink: 0,
    width: '3em',
    height: '4.5em',
    borderRadius: '0.25em',
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    '>strong': {
      fontSize: 5,
      fontWeight: 'strong',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>span': {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      minWidth: 0,
      fontSize: 6,
      '>code': {
        flexShrink: 0,
        fontFamily: 'monospace',
        color: 'grayDarkest',
        fontVariantNumeric: 'tabular-nums',
      },
      '>span': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
}

const Line = memo(UILine)

export const Calendar = compose(
  withTitle('Shows Calendar'),
  withFollowedShows(),
  withFetchQuery(APIQuery.episodes.getEpisodes({ params: { limit: '' } }), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.calendar.title'),
    useStatistics: () => STATISTICS,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content', 'min-content 1fr min-content'],
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: [
          `"air_date results"`,
          `"title air_date results"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
    },
    fields: {
      air_date: {
        initial: new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1),
        serialize: (key, raw) => monthRange(raw),
        component: withProps({ display: 'datePicker' })(({ ...props }) => (
          <div sx={{ display: 'flex', marginLeft: ['-2em', '3em'], marginRight: ['0em', '3em'], '>*': { flex: 1 } }}>
            <FilterReleaseDate {...props as any} />
          </div>
        )),
      },
    },
  }),
  withBody(),
)(Agenda)

export default Calendar
