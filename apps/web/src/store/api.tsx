import { API } from '@sensorr/services'
import i18n from '@sensorr/i18n'

const api = new API('/api/', localStorage.getItem('sensorr_access_token'))

export const query = api.query

// The message of a request `api.fetch` refused with `rawError`: the API says what to fix, the SMTP server's words for
// a refused mail. A coded error reads in the language of the interface, the others as the API wrote them
export const errorOf = async (err) => {
  try {
    const { code, values = {}, message } = await err.json()

    if (!code || !i18n.exists(`errors.${code}`)) {
      return message
    }

    const missing = values.missing && new Intl.ListFormat(i18n.language).format(values.missing.map((key) => i18n.t(`errors.mail.fields.${key}`)))
    return i18n.t(`errors.${code}`, { ...values, ...(missing ? { missing } : {}) })
  } catch (e) {
    return null
  }
}

export const useAPI = () => api

export const withAPI = () => (WrappedComponent) => {
  const WithAPI = ({ entity, ...props }) => {
    const api = useAPI() as API

    return (
      <WrappedComponent {...props} api={api} />
    )
  }

  WithAPI.displayName = `withAPI(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithAPI
}
