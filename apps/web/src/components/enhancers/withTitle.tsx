import { useTranslation } from 'react-i18next'
import { useTitle } from '@sensorr/utils'

// Takes a key, translated at render: a title translated at import would keep the language of the import
const withTitle = (key: string) => (WrappedComponent) => {
  const WithTitle = (props) => {
    const { t } = useTranslation()
    useTitle(t(key))

    return (
      <WrappedComponent {...props} />
    )
  }

  WithTitle.displayName = `withTitle(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithTitle
}

export default withTitle
