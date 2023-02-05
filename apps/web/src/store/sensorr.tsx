import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { Sensorr } from '@sensorr/sensorr'
import { useAbortController } from '@sensorr/utils'

const sensorr = new Sensorr({}, {
  proxify: true,
  access_token: localStorage.getItem('sensorr_access_token'),
})

export default sensorr

export const useSensorr = () => sensorr

export const useSensorrRequest = () => {
  const sensorr = useSensorr()
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
    } catch (err) {
      console.warn(err)

      if (err.name !== 'AbortError') {
        setDone(true)
        setLoading(false)

        toast.error('Error while fetching releases from Znabs')
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
