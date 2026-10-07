import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { MovieProps } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { utils } from '@sensorr/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { useTMDB } from '../../store/tmdb'

type withLoadableCreditsProps = MovieProps

const empty = []

export const useLoadableCredits = (id, includes, more) => {
  const tmdb = useTMDB()
  const { metadata: persons, loading: personsLoading } = usePersonsMetadataContext() as any
  const [credits, setCredits] = useState(null)

  const loadCredits = useCallback(async () => {
    if (!id || credits) {
      return
    }

    try {
      const raw = await tmdb.fetch(`movie/${id}/credits`)
      setCredits(utils
        .sortCredits(raw, Object.keys(persons), includes)
        .map(credit => ({ entity: credit, state: persons[credit.id]?.state || 'ignored' }))
      )
    } catch (err) {
      setCredits([])
      console.warn(err)
      toast.error(i18n.t('enhancers.loadableCredits.error'))
    }
  }, [id, persons, credits])

  useEffect(() => {
    setCredits(null)
  }, [id])

  const value = useMemo(() => (
    credits === null ? null : [
      ...(more ? more : []),
      ...((personsLoading || !id) ? empty : credits)
    ].filter((a, index, self) => index === self.findIndex(b => a.entity.id === b.entity.id))
  ), [more, personsLoading, id, credits])

  return { credits: value, loadCredits }
}

const withLoadableCredits = (
  includes: ('crew' | 'cast')[] = [],
) => (WrappedComponent) => {
  const WithLoadableCredits = ({ entity, ...props }: withLoadableCreditsProps) => {
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

  WithLoadableCredits.displayName = `withLoadableCredits(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithLoadableCredits
}

export default withLoadableCredits
