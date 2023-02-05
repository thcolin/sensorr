import { Suspense } from 'react'
import { Warning } from '@sensorr/ui'

export const withSuspenseFallback = (WrappedComponent, name = '') => {
  const withSuspenseFallback = (props) => (
    <Suspense fallback={<Warning emoji='⏳' title='Loading' subtitle='Please wait a few moments...' />}>
      <WrappedComponent {...props} />
    </Suspense>
  )

  withSuspenseFallback.displayName = `withSuspenseFallback(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withSuspenseFallback
}

export default withSuspenseFallback
