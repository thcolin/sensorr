import { useEffect, useMemo, useRef, useState } from 'react'
import { useControlsState, Warning } from '@sensorr/ui'
import { Policy } from '@sensorr/sensorr'
import { useSensorrRequest, useSensorr, SENSORR_POLICIES } from '../../store/sensorr'

export const withSensorrRequest = () => (WrappedComponent) => {
  const withSensorrRequest = ({ entity, metadata, ready, ...props }) => {
    const current = useRef(null)
    const sensorr = useSensorr()
    const [query] = useMemo(() => sensorr.useQuery(entity, metadata.query), [entity, JSON.stringify(metadata.query)])
    const [policy, controlsState] = useControlsState(createUseControlsValues(metadata.policy), parsePolicy)
    const { call, reset, id, loading, done, tasks, releases } = useSensorrRequest() as any

    const entities = useMemo(() => (policy?.apply && policy.apply(releases || [], query)) || (releases || []), [releases, query, policy])

    const progress = useMemo(() => ({
      id,
      loading,
      done,
      ongoing: tasks.find(({ releases, ...task }) => task.ongoing),
      tasks: tasks.map(task => ({
        ...task,
        releases: policy.apply(task.releases || [], query),
      })),
    }), [id, loading, done, tasks, query, policy])

    const controls = useMemo(() => ({
      ...controlsState,
      props: {
        progress,
        refresh: () => call(query),
      },
    }), [controlsState, progress, call, query])

    useEffect(() => {
      if (ready && query !== current.current) {
        current.current = query
        call(query)
        return
      }

      if (query !== current.current) {
        reset()
      }
    }, [ready, query])

    return (
      <WrappedComponent
        {...props as any}
        entities={entities}
        length={entities.length}
        controls={controls}
        override={!ready ? (
          <div sx={styles.empty}>
            <Warning
              emoji="🎟"
              title="Setting up Sensorr"
              subtitle="Loading movie data and custom preferences, please wait a few moments..."
            />
          </div>
        ) : (!releases.length && (loading || !done)) ? (
          <div sx={styles.empty}>
            <Warning
              emoji="🎟"
              title="Searching for movie releases on ZNABS"
              subtitle={!progress.ongoing ? 'Setting up Sensorr with movie data and custom preferences, please wait a few moments...' : (
                <span>
                  Using <em>"{progress.ongoing?.term}"</em> term on <strong>{progress.ongoing?.znab?.name}</strong>...
                </span>
              )}
            />
          </div>
        ) : (!releases.length && (!loading || done)) ? (
          <div sx={styles.empty}>
            <Warning
              emoji="📭"
              title="No releases found for movie"
              subtitle={(
                <span>
                  Sorry, no releases found on <strong>{[...new Set(progress.tasks.map(({ znab }) => znab.name))].join(', ')}</strong> with "{[...new Set(progress.tasks.map(({ term }) => term))].join('", "')}" terms
                </span>
              )}
            />
          </div>
        ) : null}
      />
    )
  }

  withSensorrRequest.displayName = `withSensorrRequest(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withSensorrRequest
}

const styles = {
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
}

const createUseControlsValues = (policy) => {
  const [values, setValues] = useState(null)

  useEffect(() => {
    setValues(serializePolicy(new Policy(policy, SENSORR_POLICIES)))
  }, [policy])

  return () => [values, setValues]
}

const serializePolicy = (policy) => ({
  sorting: {
    value: policy.sorting,
    sort: policy.descending,
  },
  ...Object.keys(policy.prefer).reduce((acc, key) => ({
    ...acc,
    [key]: [
      ...policy.prefer[key].map(value => ({ value, label: value, group: 'prefer' })),
      ...policy.avoid[key].map(value => ({ value, label: value, group: 'avoid' })),
    ],
  }), {}),
  ...Object.keys(policy.avoid).reduce((acc, key) => ({
    ...acc,
    [key]: [
      ...policy.prefer[key].map(value => ({ value, label: value, group: 'prefer' })),
      ...policy.avoid[key].map(value => ({ value, label: value, group: 'avoid' })),
    ],
  }), {}),
})

const parsePolicy = ({ sorting, descending, ...values }) => new Policy({
  sorting,
  descending,
  prefer: Object.keys(values).reduce((prefer, key) => ({ ...prefer, [key]: values[key].filter(v => v.group === 'prefer').map(({ value }) => value), }), {}),
  avoid: Object.keys(values).reduce((avoid, key) => ({ ...avoid, [key]: values[key].filter(v => v.group === 'avoid').map(({ value }) => value), }), {}),
})
