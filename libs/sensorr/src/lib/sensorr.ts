import { Znab as ZnabInterface } from './interfaces'
import { nanoid, clean } from './utils'
import { Znab } from './znab'

export class Sensorr {
  znabs: ZnabInterface[] = []
  region: string
  options?: {
    proxify?: boolean,
  }

  constructor({
    znabs,
    region,
  }: {
    znabs: ZnabInterface[],
    region: string,
  }, options: {
    proxify?: boolean,
  } = {}) {
    this.znabs = znabs
    this.region = region
    this.options = options
  }

  useQuery(movie, query = null) {
    const defaultQuery = {
      titles: [...new Set(
        [
          movie?.title,
          movie?.original_title,
          ...(movie?.alternative_titles?.titles || [])
            .filter(({ type, iso_3166_1 }) => type !== 'Alphabetical' && ['US', 'GB', this.region.slice(-2)].includes(iso_3166_1))
            .map(({ title }) => title),
        ].filter(v => v).map(title => clean(title))
      )],
      terms: [...new Set(
        [
          movie?.title,
          movie?.original_title,
          ...(movie?.alternative_titles?.titles || [])
            .filter(({ type, iso_3166_1 }) => type !== 'Alphabetical' && ['US', 'GB', this.region.slice(-2)].includes(iso_3166_1))
            .map(({ title }) => title),
        ].filter(v => v).map(title => clean(title))
      )]
      .reduce((acc, value, index, array) => [
        ...acc,
        ...(array.filter((v, i) => i !== index).every(v => !value.includes(v)) ? [value] : []),
      ], []),
      years: [...new Set([
        `${new Date(movie.release_date).getFullYear()}`,
        ...(movie?.release_dates?.results || []).reduce((acc, curr) => [
          ...acc,
          ...(curr.release_dates || [])
            .filter(({ type }) => type == 2)
            .map(({ release_date }) => `${new Date(release_date).getFullYear()}`),
        ], []),
      ].filter(v => v))],
    }

    return [(query?.titles?.length && query?.terms?.length && query?.years?.length) ? query : defaultQuery, defaultQuery]
  }

  async *call(
    query: { terms: string[], [key: string]: any },
    onTasksChange: ({}: any) => void,
    signal?: any
  ) {
    const id = nanoid()
    const handleTasksChange = (tasks) => signal?.aborted !== true && onTasksChange([...tasks.map(task => ({ ...task }))])
    const tasks = this.znabs
      .filter(znab => !znab.disabled)
      .reduce((tasks, znab) => [
        ...tasks,
        ...query.terms.map(term => ({ id, znab, term, releases: null, ongoing: false, done: false })),
      ], [])

    handleTasksChange(tasks)
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (800 - 400 + 1) + 400)))

    for (const [index, task] of tasks.entries()) {
      try {
        signal?.throwIfAborted()
        tasks[index].ongoing = true
        handleTasksChange(tasks)
        tasks[index].releases = await new Znab(task.znab, this.options).search(task.term, { signal })
        tasks[index].ongoing = false
        tasks[index].done = true
        signal?.throwIfAborted()
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

        console.warn(e)
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
