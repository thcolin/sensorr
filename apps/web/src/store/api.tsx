import { API } from '@sensorr/services'

const api = new API('/api/', localStorage.getItem('sensorr_access_token'))

export const query = api.query

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
