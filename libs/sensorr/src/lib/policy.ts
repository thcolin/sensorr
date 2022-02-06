import { compareTwoStrings as similarity } from 'string-similarity'
import { Policy as PolicyInterface } from './interfaces'
import { clean } from './utils'

const MINIMUM_SIMILARITY = 0.6

export const SENSORR_POLICY_FALLBACK = {
  label: 'none',
  value: 'none',
  sorting: 'seeders',
  descending: true,
  prefer: {
    znab: [],
    source: [],
    encoding: [],
    resolution: [],
    language: [],
    dub: [],
    flags: []
  },
  avoid: {
    znab: [],
    source: [],
    encoding: [],
    resolution: [],
    language: [],
    dub: [],
    flags: []
  }
}

export class Policy {
  name: string
  sorting: string
  descending: boolean
  prefer: {
    znab: string[],
    source: string[],
    encoding: string[],
    resolution: string[],
    language: string[],
    dub: string[],
    flags: string[],
  }
  avoid: {
    znab: string[],
    source: string[],
    encoding: string[],
    resolution: string[],
    language: string[],
    dub: string[],
    flags: string[],
  }

  constructor(raw: string | PolicyInterface, policies = []) {
    const policy = ((raw as any)?.prefer && (raw as any)?.avoid) ? raw : (policies.find(p => p.name === raw) || policies[0] || SENSORR_POLICY_FALLBACK)
    this.name = policy.name || 'none'
    this.sorting = policy.sorting || 'seeders'
    this.descending = policy.descending || true
    this.prefer = {
      znab: policy.prefer.znab || [],
      source: policy.prefer.source || [],
      encoding: policy.prefer.encoding || [],
      resolution: policy.prefer.resolution || [],
      language: policy.prefer.language || [],
      dub: policy.prefer.dub || [],
      flags: policy.prefer.flags || []
    }
    this.avoid = {
      znab: policy.avoid.znab || [],
      source: policy.avoid.source || [],
      encoding: policy.avoid.encoding || [],
      resolution: policy.avoid.resolution || [],
      language: policy.avoid.language || [],
      dub: policy.avoid.dub || [],
      flags: policy.avoid.flags || []
    }
  }

  apply(
    releases: any[],
    query: { years: number[], titles: string[], terms: string[] },
    strict = false
  ) {
    return releases
      .map(release => Policy.normalizers.releasePublishDate(release, query.years))
      .map(release => Policy.normalizers.movieReleaseYears(release, query.years))
      .map(release => Policy.normalizers.releaseTitlesSimilarity(release, [...new Set([...query.titles, ...query.terms])]))
      .map(release => Policy.normalizers.releasePolicy(release, this))
      .map(release => Policy.normalizers.releaseNoSeeders(release))
      .map(release => Policy.normalizers.releaseScore(release, this))
      .filter(release => !strict || release.valid)
      .sort((a: any, b: any) => {
        if (a.score === b.score) {
          if (this.descending) {
            if (a[this.sorting] < b[this.sorting]) return 1
            if (a[this.sorting] > b[this.sorting]) return -1
          } else {
            if (a[this.sorting] < b[this.sorting]) return -1
            if (a[this.sorting] > b[this.sorting]) return 1
          }

          return 0
        }

        return a.score < b.score ? 1 : -1
      })
  }

  static normalizers = {
    releasePublishDate: (release, years) => {
      if (!release.valid) {
        return release
      }

      const valid = years.some(year => new Date(release.publishDate).getFullYear() >= parseInt(year))

      return {
        ...release,
        valid,
        reason: valid ? null : `📰 Release published year (${new Date(release.publishDate).getFullYear()}) prior to movie release years (${years.join(', ')})`,
        warning: valid ? 0 : 50,
      }
    },
    movieReleaseYears: (release, years) => {
      if (!release.valid) {
        return release
      }

      const valid = (parseInt(release.meta.year) === 0 || years.some(year => parseInt(release.meta.year) === parseInt(year)))

      return {
        ...release,
        valid,
        reason: valid ? null : `📅 Release year (${release.meta.year}) ${
          parseInt(release.meta.year) === 0 ? 'unknown' : `different from movie release years (${years.join(', ')})`
        }`,
        warning: valid ? 0 : 40,
      }
    },
    releaseNoSeeders: (release) => {
      if (!release.valid) {
        return release
      }

      const valid = !!release.seeders

      return {
        ...release,
        valid,
        reason: valid ? null : `🌍 No seeders`,
        warning: valid ? 0 : 30,
      }
    },
    releaseTitlesSimilarity: (release, titles) => {
      if (!release.valid) {
        return release
      }

      const current = titles
        .map(title => similarity(title, clean(release.meta.title)))
        .sort((a, b) => b - a)
        .shift()

      const valid = current >= MINIMUM_SIMILARITY

      return ({
        ...release,
        similarity: current,
        score: valid ? release.score + 1000 : release.score,
        valid,
        reason: valid ? null : `🎯 Similarity too low: ${current.toFixed(2)} ("${clean(release.meta.title)}" doesn't match enough with any "${titles.join('", "')}")`,
        warning: valid ? 0 : 20,
      })
    },
    releasePolicy: (release, policy) => {
      if (!release.valid) {
        return release
      }

      try {
        return ({
          ...release,
          valid: Object.keys(policy.avoid || {})
            .map(tag => {
              const test = (tag === 'custom' ?
                (keyword) => (new RegExp(keyword, 'ig').test(release.meta.original) || new RegExp(keyword, 'ig').test(release.meta.generated)) :
                (keyword) => (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword)
              )

              const intersection = policy.avoid[tag].filter(test)

              if (intersection.length) {
                throw new Error(`🚨 Dropped by policy (${tag}=${intersection.join(', ')})`)
              }

              return true
            })
            .every(bool => bool),
          reason: null,
          warning: 0,
        })
      } catch (e) {
        return ({
          ...release,
          valid: false,
          reason: e.message,
          warning: 10,
        })
      }
    },
    releaseScore: (release, policy) => {
      const account = Object.keys(policy.prefer || {})
        .reduce((acc, tag) => ({
          ...acc,
          [tag]: policy.prefer[tag]
            .reduce((acc, keyword, index, arr) => {
              const base = (tag === 'flags' ? 1 : (arr.length - index) / arr.length)
              const test = (tag === 'custom' ?
                (keyword) => (new RegExp(keyword, 'ig').test(release.meta.original) || new RegExp(keyword, 'ig').test(release.meta.generated)) :
                (keyword) => (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword)
              )

              return {
                ...acc,
                [keyword]: test(keyword) ? Math.floor(base * 100) : 0,
              }
            }, {})
        }), {})

      return {
        ...release,
        score: release.score + (release.valid ? 1000 : 0) + Object.keys(account).reduce((sum, key) => sum += Object.values(account[key]).reduce((s: number, v: number) => s + v, 0) as number, 0),
      }
    },
  }
}
