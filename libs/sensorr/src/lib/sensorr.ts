import { Znab as ZnabInterface } from './interfaces'
import { nanoid, clean } from './utils'
import { Znab } from './znab'

const titlesOf = (names: string[], alternatives: { title: string, type?: string, iso_3166_1: string }[] = [], countries: string[]) => [...new Set(
  [
    ...names,
    ...(alternatives || [])
      .filter(({ type, iso_3166_1 }) => type !== 'Alphabetical' && countries.includes(iso_3166_1))
      .map(({ title }) => title),
  ].filter(v => v).map(title => clean(title)).filter(v => v)
)]

const termsOf = (titles: string[]) => titles.reduce((acc, value, index, array) => [
  ...acc,
  ...(array.filter((v, i) => i !== index).every(v => !value.includes(v)) ? [value] : []),
], [])

const isLatin = (term: string) => !/\p{L}/u.test(term.replace(/\p{Script=Latin}/gu, ''))

export class Sensorr {
  znabs: ZnabInterface[] = []
  policies: any[]
  region: string
  options?: {
    proxify?: boolean,
    access_token?: string,
  }

  constructor({
    znabs = [],
    policies = [],
    region = 'en-US',
  }: {
    znabs?: ZnabInterface[],
    policies?: any[],
    region?: string,
  }, options: {
    proxify?: boolean,
    access_token?: string,
  } = {}) {
    this.znabs = znabs
    this.policies = policies
    this.region = region
    this.options = options || {}
  }

  getQuery(movie, query = null, banned_releases = []) {
    const titles = titlesOf([movie?.title, movie?.original_title], movie?.alternative_titles?.titles, ['US', 'GB', this.region.slice(-2)])
    const _defaults = movie?.query?._defaults ? movie?.query?._defaults : {
      titles,
      terms: termsOf(titles),
      years: [...new Set([
        movie?.release_date && `${new Date(movie.release_date).getFullYear()}`,
        ...(movie?.release_dates?.results || []).reduce((acc, curr) => [
          ...acc,
          ...(curr.release_dates || [])
            .filter(({ type }) => type == 2)
            .map(({ release_date }) => `${new Date(release_date).getFullYear()}`),
        ], []),
      ].filter(v => v))],
    }

    return {
      _defaults,
      banned_releases,
      ...((query?.titles?.length && query?.terms?.length && query?.years?.length) ? query : _defaults),
    }
  }

  getShowQuery(show, query = null, banned_releases = []) {
    const titles = titlesOf([show?.name, show?.original_name], show?.alternative_titles?.results, ['FR', 'US', 'GB'])
    const terms = termsOf(titles)
    const latin = terms.filter(isLatin)
    const first = show?.first_air_date ? new Date(show.first_air_date).getFullYear() : null
    const last = show?.last_air_date ? Math.max(first, new Date(show.last_air_date).getFullYear()) : first
    const _defaults = {
      titles,
      terms: latin.length ? latin : terms,
      years: first ? Array.from({ length: last - first + 1 }, (_, index) => `${first + index}`) : [],
    }

    return {
      _defaults,
      banned_releases,
      ...((query?.titles?.length && query?.terms?.length && query?.years?.length) ? query : _defaults),
    }
  }

  async *call(
    query: { terms: string[], [key: string]: any },
    excludedZnabs: string[] = [],
    onTasksChange: ({}: any) => void,
    signal?: any,
    silent?: boolean,
  ) {
    const id = nanoid()
    const handleTasksChange = (tasks) => signal?.aborted !== true && onTasksChange([...tasks.map(task => ({ ...task }))])
    const tasks = this.znabs
      .filter(znab => !znab.disabled && !excludedZnabs.includes(znab.name))
      .reduce((tasks, znab) => [
        ...tasks,
        ...query.terms.map(term => ({ id, znab, term, releases: null, ongoing: false, done: false })),
      ], [])

    handleTasksChange(tasks)
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (800 - 400 + 1) + 400)))

    for (const [index, task] of tasks.entries()) {
      try {
        signal?.throwIfAborted?.()
        tasks[index].ongoing = true
        handleTasksChange(tasks)
        tasks[index].releases = await new Znab(task.znab, this.options).search(task.term, {
          ...(this.options.access_token ? { headers: { Authorization: `Bearer ${this.options.access_token}` } } : {}),
          signal,
        })
        tasks[index].ongoing = false
        tasks[index].done = true
        signal?.throwIfAborted?.()
        yield {
          id,
          znab: task.znab,
          term: task.term,
          releases: Object.values(task.releases?.reduce((acc, release) => ({ ...acc, [release.link]: release }), {})),
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          throw e
        }

        if (!silent) {
          console.warn(e)
        }

        tasks[index].ongoing = false
        tasks[index].done = true
        tasks[index].error = e
      } finally {
        handleTasksChange(tasks)
      }
    }

    return {
      id,
      done: true,
      znabs: this.znabs.filter(znab => !znab.disabled),
      terms: query.terms,
      releases: Object.values(tasks.reduce((releases, task) => ({
        ...releases,
        ...task.releases?.reduce((acc, release) => ({ ...acc, [release.link]: release }), {}),
      }), {})),
    }
  }
}
