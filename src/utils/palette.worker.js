import Colorthief from 'utils/colorthief'

addEventListener('message', event => {
  postMessage(new Colorthief().getPaletteFromPixels(event.data.pixels, event.data.pixelCount))
})
