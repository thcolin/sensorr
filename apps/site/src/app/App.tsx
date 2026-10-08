import { Hero } from './sections/Hero'
import { Journey } from './sections/Journey'
import { Wrapped } from './sections/Wrapped'
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
      <Journey film={film} policy={data?.policy} />
      <Wrapped />
      <Bands data={data} />
      <BuiltOn film={film} />
      <Install wall={data?.wall} />
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
