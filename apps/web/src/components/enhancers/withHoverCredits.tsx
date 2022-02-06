import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MovieProps } from '@sensorr/ui'
import { useTouchable } from '@sensorr/utils'
import { utils } from '@sensorr/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { useTMDB } from '../../store/tmdb'

interface withHoverCreditsProps extends Omit<MovieProps, 'credits' | 'onHover'> {}

const withHoverCredits = (
  includes: ('crew' | 'cast')[] = [],
  delay: number = 0,
  length: number = 1,
) => (WrappedComponent) => {
  const placeholders = Array(length).fill({ entity: { profile_path: false } })
  const empty = []

  const withHoverCredits = ({ entity, ...props }: withHoverCreditsProps) => {
    const tmdb = useTMDB()
    const isTouchable = useTouchable()
    const { metadata: persons, loading: personsLoading } = usePersonsMetadataContext() as any
    const [credits, setCredits] = useState(null)
    const [loading, setLoading] = useState(false)
    const [activated, setActivated] = useState(false)
    const activatedTimeout = useRef()
    const [hover, setHover] = useState(false)
    const hoverTimeout = useRef()

    const loadCredits = useCallback(async (id) => {
      try {
        setLoading(true)
        const raw = await tmdb.fetch(`movie/${id}/credits`)
        setCredits(utils
          .sortCredits(raw, Object.keys(persons), includes)
          .map(credit => ({ entity: credit, state: persons[credit.id]?.state || 'ignored' }))
        )
      } catch (e) {
        setCredits([])
        console.warn(e)
      } finally {
        setLoading(false)
      }
    }, [Object.keys(persons)])

    useEffect(() => {
      if (!activated || isTouchable) {
        return
      }

      loadCredits(entity?.id)
    }, [activated, isTouchable])

    useEffect(() => {
      setActivated(false)
      setCredits(null)
    }, [entity?.id])

    const onHover = useMemo(() => ({
      onMouseEnter: () => {
        if (personsLoading || !entity?.id || credits !== null) {
          return
        }

        hoverTimeout.current = setTimeout(() => setHover(true), (delay === 0 ? 0 : 1250)) as any
        activatedTimeout.current = setTimeout(() => setActivated(true), delay + (delay === 0 ? 0 : 1250)) as any
      },
      onMouseLeave: () => {
        clearTimeout(hoverTimeout.current)
        clearTimeout(activatedTimeout.current)
        setHover(false)
      },
    }), [personsLoading, entity?.id, credits])

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        credits={credits ? credits : (loading || hover) ? placeholders : empty}
        onHover={onHover}
      />
    )
  }

  withHoverCredits.displayName = `withHoverCredits(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withHoverCredits
}

export default withHoverCredits
