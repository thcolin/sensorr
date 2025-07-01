import { compareTwoStrings as similarity } from 'string-similarity'
import oleoo from 'oleoo'
import { Policy as PolicyInterface } from './interfaces'
import { clean } from './utils'

const MINIMUM_SIMILARITY = 0.6

export const SENSORR_POLICY_FALLBACK = {
  label: 'none',
  value: 'none',
  sorting: 'seeders',
  descending: true,
  require: {
    znab: [],
    source: [],
    encoding: [],
    resolution: [],
    language: [],
    dub: [],
    flags: []
  },
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
  require: {
    znab: string[],
    source: string[],
    encoding: string[],
    resolution: string[],
    language: string[],
    dub: string[],
    flags: string[],
  }
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
    this.sorting = policy.sorting || 'size'
    this.descending = policy.descending
    this.require = {
      znab: policy.require?.znab || [],
      source: policy.require?.source || [],
      encoding: policy.require?.encoding || [],
      resolution: policy.require?.resolution || [],
      language: policy.require?.language || [],
      dub: policy.require?.dub || [],
      flags: policy.require?.flags || []
    }
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
    query: {
      terms: string[],
      years: number[],
      titles: string[],
      banned_releases: string[]
    } = null,
    strict = false
  ) {
    const ignore = !query

    return releases
      .map(release => ({ ...release, valid: true, score: 0, meta: release.meta || oleoo.parse(release.title, { strict: false, flagged: true }) }))
      .map(release => Policy.normalizers.bannedReleases(release, query?.banned_releases, ignore))
      .map(release => Policy.normalizers.collectionReleases(release, query?.banned_releases, ignore))
      .map(release => Policy.normalizers.releasePublishDate(release, query?.years, ignore))
      .map(release => Policy.normalizers.movieReleaseYears(release, query?.years, ignore))
      .map(release => Policy.normalizers.releaseTitlesSimilarity(release, [...new Set([...(query?.titles || []), ...(query?.terms || [])])], ignore))
      .map(release => Policy.normalizers.releasePolicy(release, this))
      .map(release => Policy.normalizers.releaseRequirePolicy(release, this, strict))
      .map(release => Policy.normalizers.releaseNoSeeders(release, ignore))
      .map(release => Policy.normalizers.releaseScore(release, this, (strict || ignore || !release.znab)))
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
    bannedReleases: (release, banned, ignore = false) => {
      if (!release.valid || ignore) {
        return release
      }

      const valid = !(banned || []).some(banned => banned === release.original || banned === release.title)

      return {
        ...release,
        valid,
        reason: valid ? null : `🚫 Release banned`,
        warning: valid ? 0 : 70,
      }
    },
    collectionReleases: (release, banned, ignore = false) => {
      if (!release.valid || ignore) {
        return release
      }

      const valid = !release.meta.flags.includes('COLLECTION')

      return {
        ...release,
        valid,
        reason: valid ? null : `📚 COLLECTION release`,
        warning: valid ? 0 : 60,
      }
    },
    releasePublishDate: (release, years, ignore = false) => {
      if (!release.valid || ignore) {
        return release
      }

      const valid = years.some(year => new Date(release.publishDate).getFullYear() >= Number(year))

      return {
        ...release,
        valid,
        reason: valid ? null : `📰 Release published year (${new Date(release.publishDate).getFullYear()}) prior to movie release years (${years.join(', ')})`,
        warning: valid ? 0 : 50,
      }
    },
    movieReleaseYears: (release, years, ignore = false) => {
      if (!release.valid || ignore) {
        return release
      }

      const valid = (Number(release.meta.year) === 0 || years.some(year => Number(release.meta.year) === Number(year)))

      return {
        ...release,
        valid,
        reason: valid ? null : `📅 Release year (${release.meta.year}) ${
          Number(release.meta.year) === 0 ? 'unknown' : `different from movie release years (${years.join(', ')})`
        }`,
        warning: valid ? 0 : 40,
      }
    },
    releaseNoSeeders: (release, ignore = false) => {
      if (!release.valid || ignore) {
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
    releaseTitlesSimilarity: (release, titles, ignore = false) => {
      if (!release.valid) {
        return release
      }

      const current = (titles
        .map(title => {
          const similarityTitle = similarity(title, clean(release.meta.title))
          const similarityAlternativeTitle = release.meta.alternativeTitle ? similarity(title, clean(release.meta.alternativeTitle)) : -Infinity

          if (similarityAlternativeTitle > similarityTitle) {
            const originalTitle = release.meta.alternativeTitle
            release.meta.alternativeTitle = release.meta.title
            release.meta.title = originalTitle
            release.meta.generated = oleoo.stringify(release.meta, { flagged: true })
            return similarityAlternativeTitle
          }

          return similarityTitle
        })
        .sort((a, b) => b - a)
        .shift()
      ) || 0

      const valid = ignore || current >= MINIMUM_SIMILARITY

      return ({
        ...release,
        title: release.meta.generated,
        similarity: current,
        valid,
        score: valid ? 1000 : 0,
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
                (keyword) => (new RegExp(keyword, 'ig').test(release.original) || new RegExp(keyword, 'ig').test(release.title)) :
                (keyword) => (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword)
              )

              const intersection = policy.avoid[tag].filter(test)

              if (intersection.length) {
                throw new Error(`🚨 Withdrawn by policy (${tag}=${intersection.join(', ')})`)
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
    releaseRequirePolicy: (release, policy, enabled = false) => {
      if (!release.valid || !enabled) {
        return release
      }

      try {
        return ({
          ...release,
          valid: Object.keys(policy.require || {})
            .filter(tag => policy.require[tag].length)
            .map(tag => {
              const test = (tag === 'custom' ?
                (keyword) => (new RegExp(keyword, 'ig').test(release.original) || new RegExp(keyword, 'ig').test(release.title)) :
                (keyword) => (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword)
              )

              const intersection = policy.require[tag].filter(test)

              if (!intersection.length) {
                throw new Error(`🚨 Withdrawn by require policy (${tag}=${(Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).join(', ')} allowed ${policy.require[tag].join(', ')})`)
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
    releaseScore: (release, policy, ignore = false) => {
      const account = Object.keys(policy.prefer || {})
        .reduce((acc, tag) => ({
          ...acc,
          [tag]: (tag === 'znab' && ignore) ? { recorded: 100 } : policy.prefer[tag]
            .reduce((acc, keyword, index, arr) => {
              const base = (tag === 'flags' ? 1 : (arr.length - index) / arr.length)
              const test = (tag === 'custom' ?
                (keyword) => (new RegExp(keyword, 'ig').test(release.original) || new RegExp(keyword, 'ig').test(release.title)) :
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
        score: (release.score || 0) + (release.valid ? 1000 : 0) + Object.keys(account).reduce((sum, key) => sum += Object.values(account[key]).reduce((s: number, v: number) => s + v, 0) as number, 0),
      }
    },
  }
}
