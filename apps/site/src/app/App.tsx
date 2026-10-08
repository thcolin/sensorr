import { Hero } from './sections/Hero'
import { Journey } from './sections/Journey'
import { Bands } from './sections/Bands'
import { BuiltOn } from './sections/BuiltOn'
import { Install } from './sections/Install'
import { Footer } from './sections/Footer'
import { useFilms } from './data'

const App = () => {
  const { data, film } = useFilms()

  return (
    <main sx={App.styles.element}>
      <Hero wall={data?.wall} />
      <Journey film={film} />
      <Bands data={data} />
      <BuiltOn film={film} />
      <Install />
      <Footer />
    </main>
  )
}

App.styles = {
  element: {
    minHeight: '100vh',
    backgroundColor: 'white',
    color: 'text',
    fontFamily: 'body',
    overflowX: 'clip',
    WebkitFontSmoothing: 'antialiased',
  },
}

export default App
