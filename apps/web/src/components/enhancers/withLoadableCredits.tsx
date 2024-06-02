import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { MovieProps } from '@sensorr/ui'
import { utils } from '@sensorr/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { useTMDB } from '../../store/tmdb'

interface withLoadableCreditsProps extends MovieProps {}

const placeholders = Array(length).fill({ entity: { profile_path: false } })
const empty = []

export const useLoadableCredits = (id, includes, more) => {
  const tmdb = useTMDB()
  const { metadata: persons, loading: personsLoading } = usePersonsMetadataContext() as any
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadCredits = useCallback(async () => {
    if (!id || credits) {
      return
    }

    try {
      setLoading(true)
      const raw = await tmdb.fetch(`movie/${id}/credits`)
      setCredits(utils
        .sortCredits(raw, Object.keys(persons), includes)
        .map(credit => ({ entity: credit, state: persons[credit.id]?.state || 'ignored' }))
      )
    } catch (err) {
      setCredits([])
      console.warn(err)
      toast.error('Error while fetching credits')
    } finally {
      setLoading(false)
    }
  }, [id, persons, credits])

  useEffect(() => {
    setCredits(null)
  }, [id])

  const value = useMemo(() => (
    credits === null ? null : [
      ...(more ? more : []),
      ...((personsLoading || !id) ? placeholders : credits ? credits : loading ? placeholders : empty)
    ].filter((a, index, self) => index === self.findIndex(b => a.entity.id === b.entity.id))
  ), [more, personsLoading, id, credits, loading])

  return { credits: value, loadCredits }
}

const withLoadableCredits = (
  includes: ('crew' | 'cast')[] = [],
) => (WrappedComponent) => {
  const withLoadableCredits = ({ entity, ...props }: withLoadableCreditsProps) => {
    const { credits, loadCredits } = useLoadableCredits(entity?.id, includes, props?.credits)

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        credits={credits}
        loadCredits={loadCredits}
      />
    )
  }

  withLoadableCredits.displayName = `withLoadableCredits(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withLoadableCredits
}

export default withLoadableCredits
