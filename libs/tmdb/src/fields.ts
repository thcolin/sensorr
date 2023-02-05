import { useState, useMemo, useEffect } from 'react'
import { Movie } from './interfaces'

const commarize = (input) => {
  const value = Number(input) || 0

  // Alter numbers larger than 1k
  if (value >= 1e3) {
    var units = ['k', 'M', 'B', 'T'];

    // Divide to get SI Unit engineering style numbers (1e3,1e6,1e9, etc)
    let unit = Math.floor(((value).toFixed(0).length - 1) / 3) * 3
    // Calculate the remainder
    var num = (value / (`1e+${unit}` as any)).toFixed(0)
    var unitname = units[Math.floor(unit / 3) - 1]

    // output number remainder + unitname
    return num + unitname
  }

  // return formatted original number
  return value.toLocaleString()
}

const serializers = {
  select: (mode) => ({
    single: (key, raw) => raw?.value ? { [key]: raw?.value } : {},
    multi: (key, raw) => raw?.values?.length ? { [key]: raw.values.map(v => v.value).join({ or: '|', and: ',' }[raw.behavior]) } : {},
  }[mode]),
  range: (max) => (key, raw) => Array.isArray(raw) ? { [`${key}.gte`]: raw[0], ...(raw[1] === max ? {} : { [`${key}.lte`]: raw[1] }) } : {},
}

const nearest = (arr, val) => arr.reduce((p, n) => (Math.abs(p) > Math.abs(n - val) ? n - val : p), Infinity) + val

const statisticians = {
  array: (key, multidimensional = false) => (entities) => entities
    .reduce((values, entity) => [...values, ...(multidimensional ? entity[key].map(value => value.id) : entity[key])], [])
    .reduce((values, _id, index, arr) => [
      ...values.filter(value => value._id !== _id),
      { _id, count: arr.filter(id => id === _id).length },
    ], []),
  boundaries: (key, parse?) => (entities, field) => entities
    .reduce((acc, entity) => acc.map(({ _id, count }) => ({
      _id,
      count: (parse ? parse(entity[key]) : nearest(field.boundaries, entity[key])) === _id ? count + 1 : count,
    })), field.boundaries.map(_id => ({ _id, count: 0 }))),
}

export const fields = {
  state: {
    initial: [],
    serialize: (key, raw) => raw?.length ? { [key]: raw.join('|') } : {},
    statistics: statisticians.array('state'),
  },
  people: {
    initial: { values: [], behavior: 'and' },
    serialize: serializers.select('multi'),
  },
  crew: {
    initial: { values: [], behavior: 'and' },
    serialize: serializers.select('multi'),
  },
  cast: {
    initial: { values: [], behavior: 'and' },
    serialize: serializers.select('multi'),
  },
  genres: {
    initial: { values: [], behavior: 'or' },
    serialize: serializers.select('multi'),
    statistics: statisticians.array('genres', true),
  },
  companies: {
    initial: { values: [], behavior: 'or' },
    serialize: serializers.select('multi'),
  },
  keywords: {
    initial: { values: [], behavior: 'or' },
    serialize: serializers.select('multi'),
  },
  original_language: {
    initial: { values: [], behavior: 'or' },
    serialize: serializers.select('multi'),
  },
  release_type: {
    initial: { values: [], behavior: 'or' },
    serialize: serializers.select('multi'),
  },
  certification: {
    initial: null,
    serialize: (key, raw) => raw?.value,
  },
  release_date: {
    initial: [new Date('1900-01-01T00:00:00'), new Date(`${(new Date()).getFullYear() + 8}-01-01T00:00:00`)],
    boundaries: Array(((new Date()).getFullYear() + 9) - 1900).fill(0).map((foo, i) => 1900 + i), // 1900-1901-1902...20XX
    statistics: statisticians.boundaries('release_date', (value) => new Date(value).getFullYear()),
    serialize: (key, raw) => Array.isArray(raw) ? { [`${key}.gte`]: raw[0].toISOString(), [`${key}.lte`]: raw[1].toISOString() } : {},
  },
  birthday: {
    initial: [new Date('1800-01-01T00:00:00'), new Date(`${(new Date()).getFullYear()}-01-01T00:00:00`)],
    boundaries: Array((new Date()).getFullYear() - 1800).fill(0).map((foo, i) => 1800 + i), // 1800-1801-1802...20XX
    statistics: statisticians.boundaries('birthday', (value) => new Date(value).getFullYear()),
    serialize: (key, raw) => Array.isArray(raw) ? { [`${key}.gte`]: raw[0].toISOString(), [`${key}.lte`]: raw[1].toISOString() } : {},
  },
  popularity: {
    initial: [0, 1000],
    boundaries: [ // 0-10-20...100-200-300..1000
      ...Array(10).fill(true).map((foo, index) => index * 10),
      ...Array(10).fill(true).map((foo, index) => (index + 1) * 100),
    ],
    serialize: serializers.range(1000),
    statistics: statisticians.boundaries('popularity'),
    humanize: ({ popularity = 0 }: Movie) => commarize(popularity),
  },
  vote_average: {
    initial: [0, 10],
    boundaries: Array(11).fill(null).map((foo, i) => i), // 0-1-2...10
    statistics: statisticians.boundaries('vote_average'),
    serialize: serializers.range(10),
  },
  vote_count: {
    initial: [0, 15000],
    boundaries: [ // 0-10-20...100-200-300..1000-2000-3000...15000
      ...Array(10).fill(true).map((foo, index) => index * 10),
      ...Array(9).fill(true).map((foo, index) => (index + 1) * 100),
      ...Array(15).fill(true).map((foo, index) => (index + 1) * 1000),
    ],
    serialize: serializers.range(15000),
    statistics: statisticians.boundaries('vote_count'),
    humanize: ({ vote_count = 0 }: Movie) => commarize(vote_count),
  },
  runtime: {
    initial: [0, 240],
    boundaries: Array(25).fill(null).map((foo, i) => i * 10), // 0-10-20...240 (= 4h)
    serialize: serializers.range(240),
    humanize: ({ runtime = 0 }: Movie) => {
      const hours = Math.trunc(runtime / 60)
      const minutes = Math.trunc(runtime % 60)

      return [hours > 0 ? `${hours}h` : '', !hours || minutes ? `${minutes}m` : ''].join(' ')
    },
  },
  known_for_department: {
    initial: { values: [], behavior: 'or' },
    serialize: serializers.select('multi'),
    statistics: statisticians.array('known_for_department', true),
  },
  gender: {
    initial: { values: [], behavior: 'or' },
    serialize: serializers.select('multi'),
    statistics: statisticians.array('gender', true),
  },
}

export const useFieldsComputedStatistics = (entities, fields) => {
  const [statistics, setStatistics] = useState({})

  useEffect(() => {
    const cb = async () => {
      const statistics = await Promise.all(Object.keys(fields).map((key) =>
        new Promise((resolve) => resolve(!fields[key].statistics ? {} : { [key]: fields[key].statistics(Object.values(entities), fields[key]) }))
      ))

      setStatistics(statistics.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {}))
    }

    cb()
  }, [entities, fields])

  return statistics
}

export const useFieldComputedRangeProps = (key, statistics) => {
  const field = fields[key]

  const min = field.boundaries.slice(0, 1).pop()
  const max = field.boundaries.slice(-1).pop()
  const marks = useMemo(() => field.boundaries.map(value => ({ value })), [])
  const data = useMemo(() => {
    if (!statistics) {
      return null
    }

    return field.boundaries.reduce((acc, value, index, arr) => {
      if ([arr.length - 1, arr.length - 2].includes(index)) {
        return {
          ...acc,
          [arr[arr.length - 2]]: (
            (statistics?.find((obj) => obj._id === -1)?.count || 0) +
            (statistics?.find((obj) => obj._id === arr[arr.length - 2])?.count || 0) +
            (statistics?.find((obj) => obj._id === arr[arr.length - 1])?.count || 0)
          )
        }
      } else {
        return {
          ...acc,
          [value]: (statistics?.find((obj) => obj._id === value)?.count || 0),
        }
      }
    }, {})
  }, [statistics])

  return { min, max, marks, data }
}
