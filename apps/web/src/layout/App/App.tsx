import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Body from '../Body/Body'
import Header from '../Header/Header'

const App = ({ ...props }) => {
  const { ready } = useTranslation()

  useEffect(() => {
    if (!ready) {
      return
    }

    const timeout = setTimeout(() => {
      (document.querySelector('#root-loading') as HTMLElement).style.setProperty('opacity', '0');
      (document.querySelector('#root') as HTMLElement).style.setProperty('height', 'unset');
      (document.querySelector('#root') as HTMLElement).style.setProperty('overflow', 'unset');
      document.querySelector('#root-loading').addEventListener('transitionend', () => {
        (document.querySelector('#root-loading') as HTMLElement).style.setProperty('z-index', '-1');
        (document.querySelector('#root-loading') as HTMLElement).remove();
      })
    }, 400)

    return () => clearTimeout(timeout)
  }, [ready])

  return (
    <>
      <Header />
      <Body />
    </>
  )
}

export default App
