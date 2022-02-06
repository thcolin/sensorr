import { API } from '@sensorr/services'

const api = new API('/api/')

export const useAPI = () => api

export const withAPI = () => (WrappedComponent) => {
  const withAPI = ({ entity, ...props }) => {
    const api = useAPI() as API

    return (
      <WrappedComponent {...props} api={api} />
    )
  }

  withAPI.displayName = `withAPI(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withAPI
}

export default api
