import Colorthief from 'utils/colorthief'

addEventListener('message', event => {
  if (event.origin === 'https://trusted-origin.com') {
    postMessage(new Colorthief().getPaletteFromPixels(event.data.pixels, event.data.pixelCount))
  }
})
