
// A query string parser gives arrays and objects too: they would reach `.split` or an operator
const scalars = (params): any => Object.fromEntries(Object.entries(params || {}).filter(([, value]) => value === null || typeof value !== 'object'))

const lookup = (table, key) => Object.hasOwn(table, `${key}`) ? table[`${key}`] : undefined

const RELEASE_TAGS = ['znab', 'encoding', 'resolution', 'source', 'dub', 'language', 'flags']

const RELEASE_KEYS = [
  'releases.proposal',
  'releases.overdue',
  'release_from',
  'release_size.lte',
  'release_size.gte',
  ...RELEASE_TAGS.flatMap(tag => [`release_${tag}.prefer`, `release_${tag}.avoid`]),
]

// `a|b` matches any of the values, `a,b` all of them
export const oneOf = (value: string | undefined, path: string, cast: (value: string) => any = (value) => value) => value ? {
  [path]: /,/.test(value) ? { $all: value.split(',').map(cast) } : { $in: value.split('|').map(cast) },
} : {}

export const between = (params, key: string, path = key, cast: (value: string) => any = Number) => (params[`${key}.lte`] || params[`${key}.gte`]) ? {
  [path]: {
    ...(params[`${key}.lte`] ? { $lte: cast(params[`${key}.lte`]) } : {}),
    ...(params[`${key}.gte`] ? { $gte: cast(params[`${key}.gte`]) } : {}),
  },
} : {}

const date = (value: string) => new Date(value)

const requested = (params) => ({
  ...oneOf(params.requested_by, 'requested_by'),
  ...(params['requested_by.gte'] ? {
    [`requested_by.${Number(params['requested_by.gte']) - 1}`]: { $exists: true },
  } : {}),
})

export const releasesFilter = (raw) => {
  const params = scalars(raw)

  if (!Object.keys(params).some(key => RELEASE_KEYS.includes(key))) {
    return {}
  }

  const proposal = `${params['releases.proposal']}` === 'true' ? { proposal: true } : {}
  const prefer = (key: string, value) => [{ releases: { $elemMatch: { [key]: value, ...proposal } } }]

  const $and = [
    ...(lookup({
      true: [{ releases: { $elemMatch: { proposal: true } } }],
      false: [{ releases: { $not: { $elemMatch: { proposal: true } } } }],
    }, params['releases.proposal']) || []),
    ...(`${params['releases.overdue']}` === 'true' ? [{ releases: { $elemMatch: { overdue: true } } }] : []),
    ...(params['release_znab.prefer'] ? prefer('znab', { $in: params['release_znab.prefer'].split('|') }) : []),
    ...(params['release_znab.avoid'] ? [{ releases: { $not: { $elemMatch: { znab: { $nin: params['release_znab.avoid'].split('|') } } } } }] : []),
    ...RELEASE_TAGS.filter(tag => tag !== 'znab').flatMap(tag => [
      ...(params[`release_${tag}.prefer`] ? prefer('title', { $regex: params[`release_${tag}.prefer`] }) : []),
      ...(params[`release_${tag}.avoid`] ? [{ releases: { $not: { $elemMatch: { title: { $regex: params[`release_${tag}.avoid`] } } } } }] : []),
    ]),
    // Scoped by the same $elemMatch as `releases.proposal`, otherwise an entry matches on a pending proposal
    // and on an unrelated release from another job
    ...(params.release_from ? prefer('from', { $in: params.release_from.split('|') }) : []),
    ...(params['release_size.lte'] ? [{ releases: { $elemMatch: { size: { $lte: params['release_size.lte'] * Math.pow(1024, 3) } } } }] : []),
    ...(params['release_size.gte'] ? [{ releases: { $elemMatch: { size: { $gte: params['release_size.gte'] * Math.pow(1024, 3) } } } }] : []),
  ]

  // Mongo refuses an empty `$and`, which an unknown value gives
  return $and.length ? { $and } : {}
}

export const movieFilter = (raw) => {
  const params = scalars(raw)

  return {
  state: { $nin: ['ignored'] },
  ...(params.state ? {
    state: { $in: params.state.split('|') }
  } : {}),
  ...(params.policy ? {
    policy: { $in: params.policy.split('|') }
  } : {}),
  ...(typeof params.refine === 'boolean' ? {
    refine: params.refine ? { $ne: false } : { $eq: false },
  } : {}),
  ...(typeof params.shrink === 'boolean' ? {
    shrink: params.shrink ? { $ne: false } : { $eq: false },
  } : {}),
  ...(`${params.reported}` === 'true' ? {
    'reports.0': { $exists: true },
  } : {}),
  ...oneOf(params.genres, 'genres.id', Number),
  ...oneOf(params.original_languages, 'original_language'),
  ...oneOf(params.spoken_languages, 'spoken_languages.iso_639_1'),
  ...oneOf(params.production_companies, 'production_companies.name'),
  ...requested(params),
  ...((params['refined_at.lte'] || params['refined_at.gte']) ? {
    refined_at: {
      ...(params['refined_at.lte'] ? { $not: { $gte: params['refined_at.lte'] }  } : {}),
      ...(params['refined_at.gte'] ? { $not: { $lte: params['refined_at.gte'] }  } : {}),
    },
  } : {}),
  ...((params['shrinked_at.lte'] || params['shrinked_at.gte']) ? {
    shrinked_at: {
      ...(params['shrinked_at.lte'] ? { $not: { $gte: params['shrinked_at.lte'] }  } : {}),
      ...(params['shrinked_at.gte'] ? { $not: { $lte: params['shrinked_at.gte'] }  } : {}),
    },
  } : {}),
  ...between(params, 'release_date', 'release_date', date),
  ...between(params, 'popularity'),
  ...between(params, 'vote_average'),
  ...between(params, 'vote_count'),
  ...between(params, 'budget', 'budget', (value) => Number(value) * 1000000),
  ...between(params, 'runtime'),
  ...releasesFilter(params),
  }
}

// What a facet counts under: every filter but its own, so picking a genre leaves the other genres counted
// and a range keeps its bars outside the picked range. With no state picked, the context sets it.
export const facetFilter = (filterOf: (params) => { [key: string]: any }, raw, ...keys: string[]) => {
  const kept = Object.fromEntries(Object.entries(scalars(raw)).filter(([key]) => !keys.includes(key.replace(/\.(gte|lte)$/, ''))))
  const { state, ...filter } = filterOf(kept)
  return kept.state ? { state, ...filter } : filter
}

const monitored = (value) => lookup({
  true: { monitored: true },
  false: { monitored: { $ne: true } },
}, value) || {}

export const showFilter = (raw) => {
  const params = scalars(raw)

  return {
  state: { $nin: ['ignored'] },
  ...(params.state ? {
    state: { $in: params.state.split('|') }
  } : {}),
  ...(params.policy ? {
    policy: { $in: params.policy.split('|') }
  } : {}),
  ...(params.status ? {
    status: { $in: params.status.split('|') }
  } : {}),
  ...(params.type ? {
    type: { $in: params.type.split('|') }
  } : {}),
  ...monitored(params.monitored),
  ...oneOf(params.genres, 'genres.id', Number),
  ...oneOf(params.networks, 'networks.id', Number),
  ...oneOf(params.original_languages, 'original_language'),
  ...oneOf(params.origin_country, 'origin_country'),
  ...requested(params),
  ...between(params, 'first_air_date', 'first_air_date', date),
  ...between(params, 'number_of_seasons'),
  ...between(params, 'popularity'),
  ...between(params, 'vote_average'),
  ...between(params, 'vote_count'),
  ...((params['episode_run_time.lte'] || params['episode_run_time.gte']) ? {
    episode_run_time: { $elemMatch: between(params, 'episode_run_time', 'value').value },
  } : {}),
  ...releasesFilter(params),
  }
}

// The same cases as `episodeStatus` in `libs/sensorr/src/lib/episode.ts`, read by Mongo
export const episodeStatusFilter = (value: unknown, now: Date) => {
  const cases = (typeof value === 'string' ? value : '').split('|').map(status => lookup({
    owned: { 'files.0': { $exists: true } },
    upcoming: { 'files.0': { $exists: false }, $or: [{ air_date: { $gt: now } }, { air_date: null, monitored: true }] },
    unmonitored: { 'files.0': { $exists: false }, monitored: { $ne: true }, $or: [{ air_date: null }, { air_date: { $lte: now } }] },
    proposed: { 'files.0': { $exists: false }, monitored: true, air_date: { $lte: now }, release: { $nin: [null, ''] } },
    wanted: { 'files.0': { $exists: false }, monitored: true, air_date: { $lte: now }, release: { $in: [null, ''] } },
  }, status)).filter(Boolean)

  return cases.length ? { $or: cases } : {}
}

// Born on one of the `value` days starting from `now`, whatever the year, as Mongo reads a date in UTC
export const upcomingBirthdayFilter = (value: unknown, now: Date) => {
  const days = Math.min(Math.floor(Number(value)), 366)

  if (!(days > 0)) {
    return {}
  }

  return {
    $or: Array.from({ length: days }, (_, index) => new Date(now.getTime() + index * 86400000)).map(day => ({
      $expr: { $and: [{ $eq: [{ $month: '$birthday' }, day.getUTCMonth() + 1] }, { $eq: [{ $dayOfMonth: '$birthday' }, day.getUTCDate()] }] },
    })),
  }
}
