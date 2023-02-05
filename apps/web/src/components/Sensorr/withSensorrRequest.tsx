import { useEffect, useMemo, useRef, useState } from 'react'
import { useControlsState, Warning } from '@sensorr/ui'
import { Policy } from '@sensorr/sensorr'
import { useSensorrRequest } from '../../store/sensorr'

export const withSensorrRequest = () => (WrappedComponent) => {
  const withSensorrRequest = ({ entity, metadata, onChange, ready, ...props }) => {
    const [serialized, state] = useSensorrControlsState(metadata)
    const { call, reset, id, loading, done, tasks, releases } = useSensorrRequest() as any
    const request = useRef(null)

    const entities = useMemo(
      () => (serialized.policy?.apply && serialized.policy.apply(releases || [], { ...serialized.query, titles: metadata.query?.titles, banned_releases: metadata.banned_releases })) || (releases || []),
      [releases, serialized.query, serialized.policy, metadata.banned_releases, metadata.query?.titles]
    )

    const progress = useMemo(() => ({
      id,
      loading,
      done,
      ongoing: tasks.find(({ releases, ...task }) => task.ongoing),
      tasks: tasks.map(task => ({
        ...task,
        releases: serialized.policy.apply(task.releases || [], { ...serialized.query, titles: metadata.query?.titles, banned_releases: metadata.banned_releases }),
      })),
    }), [id, loading, done, tasks, serialized.query, serialized.policy, metadata.banned_releases, metadata.query?.titles])

    const controls = useMemo(() => ({
      ...state,
      props: {
        ongoing: progress?.loading,
        refresh: () => call(serialized.query),
      },
    }), [state, progress?.loading, call, serialized.query])

    useEffect(() => {
      if (!serialized.query?.terms?.length) {
        return
      }

      if (ready && serialized.query !== request.current) {
        request.current = serialized.query
        call(serialized.query)
        return
      }

      if (serialized.query !== request.current) {
        reset()
      }
    }, [ready, JSON.stringify(serialized.query)])

    return (
      <WrappedComponent
        {...props as any}
        movie={entity}
        entities={entities}
        length={entities.length}
        controls={controls}
        progress={progress}
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
    color: 'text',
  },
}

const useSensorrControlsState = ({ query, policy } = {} as any) => {
  const [values, setValues] = useState({
    terms: [
      ...(query._defaults?.terms || []).map(term => ({ value: term, label: term, pinned: true, disabled: !(query.terms || []).includes(term) })),
      ...(query.titles || []).filter(title => !(query._defaults?.terms || []).includes(title)).map(title => ({ value: title, label: title, pinned: true, disabled: !(query.terms || []).includes(title) })),
      ...(query.terms || []).filter(term => !(query._defaults?.terms || []).includes(term) && !(query.titles || []).includes(term)).map(term => ({ value: term, label: term })),
    ],
    years: [
      ...(query._defaults?.years || []).map(term => ({ value: term, label: term, pinned: true, disabled: !(query.years || []).includes(term) })),
      ...(query.years || []).filter(term => !(query._defaults?.years || []).includes(term)).map(term => ({ value: term, label: term })),
    ],
    policy: { value: policy.name, label: policy.name },
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

  useEffect(() => {
    setValues({
      terms: [
        ...(query._defaults?.terms || []).map(term => ({ value: term, label: term, pinned: true, disabled: !(query.terms || []).includes(term) })),
        ...(query.titles || []).filter(title => !(query._defaults?.terms || []).includes(title)).map(title => ({ value: title, label: title, pinned: true, disabled: !(query.terms || []).includes(title) })),
        ...(query.terms || []).filter(term => !(query._defaults?.terms || []).includes(term) && !(query.titles || []).includes(term)).map(term => ({ value: term, label: term })),
        ],
      years: [
        ...(query._defaults?.years || []).map(term => ({ value: term, label: term, pinned: true, disabled: !(query.years || []).includes(term) })),
        ...(query.years || []).filter(term => !(query._defaults?.years || []).includes(term)).map(term => ({ value: term, label: term })),
      ],
      policy: { value: policy.name, label: policy.name },
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
  }, [JSON.stringify(query), JSON.stringify(policy)])

  return useControlsState(
    () => [values, setValues],
    ({ terms, years, policy, sorting, descending, ...values }) => ({
      query: { terms, years },
      policy: new Policy({
        sorting,
        descending,
        prefer: Object.keys(values).reduce((prefer, key) => ({ ...prefer, [key]: values[key].filter(v => v.group === 'prefer').map(({ value }) => value), }), {}),
        avoid: Object.keys(values).reduce((avoid, key) => ({ ...avoid, [key]: values[key].filter(v => v.group === 'avoid').map(({ value }) => value), }), {}),
      }),
    })
  )
}
