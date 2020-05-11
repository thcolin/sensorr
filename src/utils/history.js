import { createBrowserHistory } from 'history'

const history = createBrowserHistory()

export const setHistoryState = (diff) => {
  history.replace({
    pathname: window.location.pathname,
    search: window.location.search,
    state: {
      ...(window?.history?.state?.state || {}),
      ...diff,
    }
  })
}

export default history
