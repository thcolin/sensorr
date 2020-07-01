import React, { Fragment } from 'react'
import { compose } from 'redux'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Items from 'components/Layout/Items'
import withTMDBQuery from 'components/Layout/Items/withTMDBQuery'
import withControls from 'components/Layout/Items/withControls'
import Movie from 'components/Entity/Movie'
import tmdb from 'store/tmdb'
import { CERTIFICATIONS, GENRES } from 'shared/services/TMDB'
import countryLanguage from 'country-language'
import countryEmoji from 'country-emoji'
import { humanize } from 'shared/utils/string'
import { setHistoryState } from 'utils/history'
import theme from 'theme'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
}

const Filters = {
  with_original_language: () => {
    const options = countryLanguage.getLanguages()
      .filter(language => language.iso639_1 && language.name?.length)
      .map(language => ({
        value: language.iso639_1,
        label: language.name[0],
      }))

    return {
      label: 'Languages',
      type: 'select',
      options,
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_original_language: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'with_original_language',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        // placeholder: `${options.map(option => option.label).slice(0, 3).join(', ')}...`,
      },
    }
  },
  with_release_type: () => {
    const options = [
      { value: 1, label: 'Premiere' },
      // { value: 2, label: 'Limited' },
      { value: 3, label: 'Theatrical' },
      { value: 4, label: 'Digital' },
      { value: 5, label: 'Physical' },
      { value: 6, label: 'TV' },
    ]

    return {
      label: 'Released',
      type: 'select',
      options,
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_release_type: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'with_release_type',
        isMulti: true,
        isSearchable: false,
        isClearable: false,
        closeMenuOnSelect: false,
        // placeholder: `${options.map(option => option.label).slice(0, 3).join(', ')}...`,
      },
    }
  },
  certification: () => {
    const options = Object.keys(CERTIFICATIONS)
      .filter(country => countryEmoji.flag(country) && countryEmoji.name(country))
      .map(country => ({
        label: `${countryEmoji.flag(country)}  ${countryEmoji.name(country)}`,
        options: CERTIFICATIONS[country]
          .sort((a, b) => a.order - b.order)
          .map(certification => ({
            value: `${country}-${certification.certification}`,
            label: certification.certification,
          })),
      }))

    return {
      label: 'Certification',
      type: 'select',
      options,
      default: '',
      serialize: (option) => option ? {
        certification_country: option.value.split('-').shift(),
        certification: option.value.split('-').pop(),
      } : {},
      apply: () => true,
      props: {
        name: 'certification',
        isSearchable: false,
        isClearable: false,
        closeMenuOnSelect: true,
      },
    }
  },
  with_genres: () => {
    const options = Object.keys(GENRES).map(genre => ({
      value: genre,
      label: GENRES[genre],
    }))

    return {
      label: 'Genres',
      type: 'select',
      options,
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_genres: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'with_genres',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: `${options.map(option => option.label).slice(0, 3).join(', ')}...`,
      },
    }
  },
  without_genres: () => {
    const options = Object.keys(GENRES).map(genre => ({
      value: genre,
      label: GENRES[genre],
    }))

    return {
      label: <span>Genres <small>(without)</small></span>,
      type: 'select',
      options,
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        without_genres: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'without_genres',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: `${options.map(option => option.label).slice(0, 3).join(', ')}...`,
      },
    }
  },
  with_companies: () => {
    return {
      label: 'Companies',
      type: 'select',
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_companies: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'with_companies',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: 'Search...',
        noOptionsMessage: ({ inputValue }) => !inputValue ?
          '🏛️  Search for companies, like "Walt Disney Pictures"' :
          `🔦  No company found, sorry`,
        cacheOptions: true,
        defaultOptions: true,
        loadOptions: async (query) => {
          const res = await tmdb.fetch(['search', 'company'], { query, sort_by: 'popularity.desc' })
          return res.results.map(result => ({
            value: result.id,
            label: result.name,
          }))
        }
      },
    }
  },
  with_keywords: () => {
    return {
      label: 'Keywords',
      type: 'select',
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_keywords: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'with_keywords',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: 'Search...',
        noOptionsMessage: ({ inputValue }) => !inputValue ?
          '🔗️  Search for keywords, like "Zombie"' :
          `🔦  No keyword found, sorry`,
        cacheOptions: true,
        defaultOptions: true,
        loadOptions: async (query) => {
          const res = await tmdb.fetch(['search', 'keyword'], { query, sort_by: 'popularity.desc' })
          return res.results.map(result => ({
            value: result.id,
            label: result.name,
          }))
        }
      },
    }
  },
  without_keywords: () => {
    return {
      label: <span>Keywords <small>(without)</small></span>,
      type: 'select',
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        without_keywords: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'without_keywords',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: 'Search...',
        noOptionsMessage: ({ inputValue }) => !inputValue ?
          '🔗️  Search for keywords, like "Talk Show"' :
          `🔦  No keyword found, sorry`,
        cacheOptions: true,
        defaultOptions: true,
        loadOptions: async (query) => {
          const res = await tmdb.fetch(['search', 'keyword'], { query, sort_by: 'popularity.desc' })
          return res.results.map(result => ({
            value: result.id,
            label: result.name,
          }))
        }
      },
    }
  },
  with_people: () => {
    return {
      label: 'Peoples',
      type: 'select',
      default: [],
      behavior: 'AND',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_people: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || ','),
      }),
      props: {
        name: 'with_people',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: 'Search...',
        noOptionsMessage: ({ inputValue }) => !inputValue ?
          '👩‍🎤️  Search for people, like "Bill Murray"' :
          `🔦  Nobody found, sorry`,
        cacheOptions: true,
        defaultOptions: true,
        loadOptions: async (query) => {
          const res = await tmdb.fetch(['search', 'person'], { query, sort_by: 'popularity.desc' })
          return res.results.map(result => ({
            value: result.id,
            label: result.name,
          }))
        }
      },
    }
  },
  with_crew: () => {
    return {
      label: 'Crew',
      type: 'select',
      default: [],
      behavior: 'AND',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_crew: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || ','),
      }),
      props: {
        name: 'with_crew',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: 'Search...',
        noOptionsMessage: ({ inputValue }) => !inputValue ?
          '🎬  Search for crew, like "Christopher Nolan"' :
          `🔦  Nobody found, sorry`,
        cacheOptions: true,
        defaultOptions: true,
        loadOptions: async (query) => {
          const res = await tmdb.fetch(['search', 'person'], { query, sort_by: 'popularity.desc' })
          return res.results.map(result => ({
            value: result.id,
            label: result.name,
          }))
        }
      },
    }
  },
  with_cast: () => {
    return {
      label: 'Cast',
      type: 'select',
      default: [],
      behavior: 'AND',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_cast: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || ','),
      }),
      props: {
        name: 'with_cast',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: 'Search...',
        noOptionsMessage: ({ inputValue }) => !inputValue ?
          '👩‍🎤️  Search for cast, like "James Stewart"' :
          `🔦  Nobody found, sorry`,
        cacheOptions: true,
        defaultOptions: true,
        loadOptions: async (query) => {
          const res = await tmdb.fetch(['search', 'person'], { query, sort_by: 'popularity.desc' })
          return res.results.map(result => ({
            value: result.id,
            label: result.name,
          }))
        }
      },
    }
  },
  release_date: () => {
    const step = 1
    const min = 1900
    const max = step + (new Date()).getFullYear() + 7

    return {
      label: 'Year',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: step,
      apply: () => true,
      serialize: (values) => ({
        ...(values[0] !== min ? { 'primary_release_date.gte': new Date(`01/01/${values[0]}`).toISOString() } : {}),
        ...(values[1] !== max ? { 'primary_release_date.lte': new Date(`12/31/${values[1]}`).toISOString() } : {}),
      }),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [parseInt(new Date(entity.release_date).getFullYear() || 0)]: (histogram[parseInt(new Date(entity.release_date).getFullYear() || 0)] || 0) + 1,
      }), Array(max - min).fill(true).reduce((acc, curr, index) => ({ ...acc, [min + index]: 0 }), {})),
    }
  },
  vote_average: () => {
    const min = 0
    const max = 10
    const compute = (vote_average = 0) => Math.min(max, Math.max(min, Math.floor(vote_average)))

    return {
      label: 'Vote Average',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      apply: () => true,
      serialize: (values) => ({
        ...(values[0] !== min ? { 'vote_average.gte': values[0] } : {}),
        ...(values[1] !== max ? { 'vote_average.lte': values[1] } : {}),
      }),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        ...(entity.vote_average % 1 ? {
          [compute(entity.vote_average)]: (histogram[compute(entity.vote_average)] || 0) + 1,
        } : {
          [compute(entity.vote_average - 0.1)]: (histogram[compute(entity.vote_average - 0.1)] || 0) + 1,
        })
      }), Array(max - min).fill(true).reduce((acc, curr, index) => ({ ...acc, [index]: 0 }), {})),
    }
  },
  vote_count: () => {
    const min = 0
    const max = 30000

    const marks = [
      ...Array(10).fill(true).map((foo, index) => index * 100),
      ...Array(max / 1000).fill(true).map((foo, index) => (index + 1) * 1000),
    ]

    const data = [0, ...marks.slice(10)]
      .reduce((acc, value, index) => ({ ...acc, [index * 1000]: 0 }), {})

    return {
      label: 'Vote Count',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: null,
      marks: marks.map(mark => ({ value: mark })),
      labelize: humanize.bigint,
      apply: () => true,
      serialize: (values) => ({
        ...(values[0] !== min ? { 'vote_count.gte': values[0] } : {}),
        ...(values[1] !== max ? { 'vote_count.lte': values[1] } : {}),
      }),
      histogram: (entities) => entities.reduce((histogram, entity) => {
        const closest = Object.keys(data)
          .reduce((prev, curr) => (Math.abs(curr - entity.vote_count) < Math.abs(prev - entity.vote_count) ? curr : prev))

        return {
          ...histogram,
          [closest]: (histogram[closest] || 0) + 1,
        }
      }, data),
    }
  },
  runtime: () => {
    const step = 10
    const min = 0
    const max = 240

    return {
      label: 'Duration',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: step,
      serialize: (values) => ({
        ...(values[0] !== min ? { 'with_runtime.gte': values[0] } : {}),
        ...(values[1] !== max ? { 'with_runtime.lte': values[1] } : {}),
      }),
      labelize: (value) => humanize.time(value).replace(/ /, ''),
      apply: () => true,
      histogram: () => Array(Math.floor((max - min) / 10)).fill(true).reduce((acc, curr, index) => ({ ...acc, [index * 10]: 0 }), {}),
    }
  },
}

const Sortings = {
  popularity: {
    value: 'popularity',
    label: '📣  Popularity',
    labelize: (entity) => entity.popularity,
    apply: () => 0,
    // apply: (a, b, reverse) => (parseInt((reverse ? a : b).popularity) || 0) - (parseInt((reverse ? b : a).popularity) || 0),
  },
  release_date: {
    value: 'release_date',
    label: '📅  Release date',
    labelize: (entity) => new Date(entity.release_date || 0).toLocaleDateString(),
    apply: () => 0,
    // apply: (a, b, reverse) => new Date((reverse ? a : b).release_date || 0) - new Date((reverse ? b : a).release_date || 0),
  },
  // // Useless if `release_date` (?)
  // primary_release_date: {
  //   value: 'primary_release_date',
  //   label: '🎟️  Primary Release date',
  //   labelize: (entity) => new Date(entity.primary_release_date || 0).toLocaleDateString(),
  //   apply: () => 1,
  // },
  // Data not available on `discover/movie`
  revenue: {
    value: 'revenue',
    label: '💵  Revenue',
    labelize: (entity) => entity.revenue || 0,
    apply: () => 0,
    // apply: (a, b, reverse) => (parseInt((reverse ? a : b).revenue) || 0) - (parseInt((reverse ? b : a).revenue) || 0),
  },
  // // Useless (?)
  // original_title: {
  //   value: 'original_title',
  //   label: '✏️  Original Title',
  //   labelize: (entity) => entity.original_title || '',
  //   apply: () => 1,
  // },
  vote_average: {
    value: 'vote_average',
    label: '⭐  Vote Average',
    labelize: (entity) => entity.vote_average || 0,
    apply: () => 0,
    // apply: (a, b, reverse) => (parseInt((reverse ? a : b).vote_average) || 0) - (parseInt((reverse ? b : a).vote_average) || 0),
  },
  vote_count: {
    value: 'vote_count',
    label: '🗳  Vote Count',
    labelize: (entity) => entity.vote_count || 0,
    apply: () => 0,
    // apply: (a, b, reverse) => (parseInt((reverse ? a : b).vote_count) || 0) - (parseInt((reverse ? b : a).vote_count) || 0),
  },
}

const Labels = {
  with_original_language: 'Languages',
  with_release_type: 'Released',
  certification: 'Certification',
  with_genres: 'Genres',
  without_genres: 'Without genre',
  with_companies: 'Companies',
  with_keywords: 'Keywords',
  without_keywords: 'Without keyword',
  with_people: 'Peoples',
  with_crew: 'Crew',
  with_cast: 'Cast',
  release_date: 'Year',
  vote_average: 'Vote Average',
  vote_count: 'Vote Count',
  runtime: 'Duration',
}

const DiscoverItems = compose(
  withTMDBQuery({
    uri: ['discover', 'movie'],
    params: { include_video: false },
  }, null, true),
  withControls({
    hideQuery: true,
    label: ({ total, reset }) => (
      <button css={theme.resets.button} onClick={() => reset()}>
        <span><strong>{total === 10000 ? '∞' : total}</strong> Discovered Movies</span>
      </button>
    ),
    filters: Filters,
    sortings: Sortings,
    initial: () => ({
      filtering: window?.history?.state?.state?.controls?.filtering || {},
      behaviors: window?.history?.state?.state?.controls?.behaviors || {},
      sorting: window?.history?.state?.state?.controls?.sorting || 'popularity',
      reverse: window?.history?.state?.state?.controls?.reverse || false,
    }),
    defaults: {
      filtering: {},
      behaviors: {},
      sorting: 'popularity',
      reverse: false,
    },
    render: {
      pane: (blocks) => (
        <>
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.with_people.element, blocks.with_people.props)}
            {Emotion.jsx(blocks.with_crew.element, blocks.with_crew.props)}
            {Emotion.jsx(blocks.with_cast.element, blocks.with_cast.props)}
          </div>
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.with_genres.element, blocks.with_genres.props)}
            {Emotion.jsx(blocks.without_genres.element, blocks.without_genres.props)}
          </div>
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.with_companies.element, blocks.with_companies.props)}
            {Emotion.jsx(blocks.with_keywords.element, blocks.with_keywords.props)}
            {Emotion.jsx(blocks.without_keywords.element, blocks.without_keywords.props)}
          </div>
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.release_date.element, { ...blocks.release_date.props, display: 'column' })}
            {Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
            {Emotion.jsx(blocks.vote_count.element, { ...blocks.vote_count.props, display: 'column' })}
            {Emotion.jsx(blocks.runtime.element, { ...blocks.runtime.props, display: 'column' })}
          </div>
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.with_original_language.element, blocks.with_original_language.props)}
            {Emotion.jsx(blocks.with_release_type.element, blocks.with_release_type.props)}
            {Emotion.jsx(blocks.certification.element, blocks.certification.props)}
          </div>
          {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
        </>
      ),
    },
  }),
)(Items)

const Discover = ({ history, ...props }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Discover {
        Object.keys(window?.history?.state?.state?.controls?.filtering || {}).length ?
        `(${
          Object.keys(window?.history?.state?.state?.controls?.filtering)
            .filter(key => Object.keys(Labels).includes(key) && Array.isArray(window?.history?.state?.state?.controls?.filtering[key]))
            .map(key => `${Labels[key]}: ${window?.history?.state?.state?.controls?.filtering[key]
              .map(value => value?.label || value)
              .join(typeof value === 'Object' ? ', ' : '-')}`
            )
            .join(' / ')
        })` : ''}
      </title>
    </Helmet>
    <div css={styles.wrapper}>
      <DiscoverItems
        display="virtual-grid"
        child={Movie}
        placeholders={history.location.state?.items?.total || null}
        onFetched={({ total }) => setHistoryState({ items: { total } })}
        empty={{
          emoji: '🍿',
          title: "Oh no, your request didn't return results",
          subtitle: (
            <span>
              Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
            </span>
          ),
        }}
      />
    </div>
  </Fragment>
)

export default Discover
