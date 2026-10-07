import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning } from '@sensorr/ui'

export const withSuspenseFallback = (WrappedComponent, name = '') => {
  const WithSuspenseFallback = (props) => {
    const { t } = useTranslation()

    return (
      <Suspense fallback={<Warning emoji='⏳' title={t('state.loading')} subtitle={t('layout.suspense.subtitle')} />}>
        <WrappedComponent {...props} />
      </Suspense>
    )
  }

  WithSuspenseFallback.displayName = `withSuspenseFallback(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithSuspenseFallback
}

export default withSuspenseFallback
