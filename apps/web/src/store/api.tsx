import { API } from '@sensorr/services'

const api = new API('/api/', localStorage.getItem('sensorr_access_token'))

export const query = api.query

// The message of a request `api.fetch` refused with `rawError`: the API says what to fix, the SMTP server's words for
// a refused mail
export const errorOf = async (err) => {
  try {
    return (await err.json()).message
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
