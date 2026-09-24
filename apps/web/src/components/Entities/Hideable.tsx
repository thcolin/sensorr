import { createContext, useContext, useMemo } from 'react'
import { Entities } from '@sensorr/ui'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'

const HideLibraryContext = createContext({ hideLibrary: false, useMetadataContext: useMoviesMetadataContext })

const HideableChild = ({ child: Child, ...props }) => {
  const { hideLibrary, useMetadataContext } = useContext(HideLibraryContext)
  const { loading, metadata: { [props.entity?.id]: metadata = null } } = useMetadataContext() as any

  return (
    <Child
      {...props}
      opacity={(!loading && hideLibrary && metadata && metadata?.state !== 'ignored') ? 0.125 : 1}
    />
  )
}

// `hide_library` goes through a context rather than into the child's closure: a new child
// component on each toggle would remount every card and reload its poster.
export const EntitiesHideable = ({ controls, child, useMetadataContext = useMoviesMetadataContext, ...props }) => {
  const Child = useMemo(() => (props) => <HideableChild {...props} child={child} />, [child])
  const value = useMemo(() => ({ hideLibrary: !!controls.values.hide_library, useMetadataContext }), [controls.values.hide_library, useMetadataContext])

  return (
    <HideLibraryContext.Provider value={value}>
      <Entities {...props as any} child={Child} />
    </HideLibraryContext.Provider>
  )
}
