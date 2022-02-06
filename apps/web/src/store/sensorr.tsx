import { useCallback, useState } from 'react'
import { Sensorr } from '@sensorr/sensorr'
import { useAbortController } from '@sensorr/utils'
import config from './config'

const sensorr = new Sensorr({ znabs: config.get('znabs'), region: config.get('region') }, { proxify: true })
export default sensorr

export const SENSORR_POLICIES = config.get('policies')

export const useSensorr = () => sensorr

export const useSensorrRequest = () => {
  const { abort } = useAbortController()
  const [id, setID] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [tasks, setTasks] = useState([])
  const [releases, setReleases] = useState([])

  const reset = useCallback(() => {
    setID(null)
    setDone(false)
    setTasks([])
    setLoading(true)
    setReleases([])
  }, [])

  const call = useCallback(async (query) => {
    try {
      const controller = abort()
      reset()
      const res = sensorr.call(query, (tasks) => {
        setTasks(tasks)
        setID(tasks[0]?.id)
      }, controller.signal)
      let done = false

      do {
        const raw = await res.next()
        done = raw.done

        if (!raw.done) {
          setReleases(releases => Object.values({
            ...releases.reduce((acc, release) => ({ ...acc, [release.link]: release }), {}),
            ...(raw.value.releases as any).reduce((acc, release) => ({ ...acc, [release.link]: release }), {}),
          }))
        }
      } while (!done)

      setDone(true)
      setLoading(false)
    } catch (e) {
      console.warn(e)

      if (e.name !== 'AbortError') {
        setDone(true)
        setLoading(false)
      }
    }
  }, [])

  return {
    call,
    reset,
    id,
    loading,
    done,
    tasks,
    releases,
  }
}
