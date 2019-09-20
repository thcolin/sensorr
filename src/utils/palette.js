import Colorthief from 'utils/colorthief'
import Color from 'color'

var CanvasImage = function (image) {
  this.canvas = document.createElement('canvas')
  document.body.appendChild(this.canvas)

  this.context = this.canvas.getContext('2d')

  this.width = this.canvas.width = image.width
  this.height = this.canvas.height = image.height

  this.canvas.style.display = 'none'

  this.context.drawImage(image, 0, 0, this.width, this.height)
}

CanvasImage.prototype.clear = function () {
  this.context.clearRect(0, 0, this.width, this.height)
}

CanvasImage.prototype.update = function (imageData) {
  this.context.putImageData(imageData, 0, 0)
}

CanvasImage.prototype.getPixelCount = function () {
  return this.width * this.height
}

CanvasImage.prototype.getImageData = function () {
  return this.context.getImageData(0, 0, this.width, this.height)
}

CanvasImage.prototype.removeCanvas = function () {
  if (this.canvas.parentNode) {
    this.canvas.parentNode.removeChild(this.canvas)
  }
}

const THRESHOLD_CONTRAST_RATIO = 1.0
const MINIMUM_CONTRAST_RATIO = 4.5 // This is the minimum required for "AA" certification

let totalPixelCount = 0
let RGBToPixelCountMap = {} // Track pixel count by RGB values, reset everytime a palette is parsed.

/**
 * The "range" is a metric used to determine how
 * vibrant a color is. It checks the delta between
 * the highest and lowest channel values, giving us an indiciation
 * of how dominant one range might be.
 *
 * @example
 * For the RGB value [250, 30, 10] we can see
 * that the red channel dominates, meaning it will be
 * primarily red.
 */
function getRGBRange (color) {
  const rgb = color.rgb().array().sort((a, b) => b - a)
  const [max, med, min] = rgb
  return (max - min) / 10
}

/**
 * Returns a value between 0 and 1 representing how
 * many pixels in the original image are represented
 * by this color, 0 meaning none and 1 meaning all.
 * @param {*} color
 * @returns {number}
 */
function getPixelDominance (color) {
  const pixelCount = RGBToPixelCountMap[color]
  return pixelCount / totalPixelCount
}

/**
 * Calculates the total score for each color
 * in an array of pairs which are matches for some
 * dominant color. Score represents viability, so higher is better.
 * @param {*} pairs
 * @returns {number}
 */
function calculateTotalPairScore (pairs) {
  return pairs.reduce((score, color) => score + color.score, 0)
}

/**
 * Return a new array of pairs, sorted by score.
 * @param {*} pairs
 */
function sortPairsByScore (pairs) {
  pairs.sort((a, b) => a.score === b.score ? 0 : a.score > b.score ? -1 : 1)
}

/**
 * Dominance is ranked using a system that weighs
 * each dominant color by three factors:
 *  - The true dominance of the color in the original image.
 *    This is determined by tracking the total number of pixels
 *    in the image, and the total pixels found for an image,
 *    and dividing the color pixels by the total.
 *
 *  - The number of valid color pairs. If a color has no matching
 *    pairs it is given a score of zero, since we can't build
 *    a color palette with a single color.
 *
 *  - The total score of each matching color. Each color is scored
 *    based on the contrast with the dominant color, the dominance
 *    in the original image, and its "range", which is the difference
 *    between the highest channel value and lowest, which sort of measures
 *    vibrance.
 * @param {*} WCAGCompliantColorPairs
 */
function getMostDominantPrimaryColor (WCAGCompliantColorPairs) {
  let highestDominanceScore = 0
  let mostDominantColor = ''

  for (let dominantColor in WCAGCompliantColorPairs) {
    const pairs = WCAGCompliantColorPairs[dominantColor]
    const dominance = getPixelDominance(dominantColor)
    const totalPairScore = calculateTotalPairScore(pairs)
    const score = pairs.length ? (pairs.length + totalPairScore) * dominance : 0

    if (score > highestDominanceScore) {
      highestDominanceScore = score
      mostDominantColor = dominantColor
    }
  }

  sortPairsByScore(WCAGCompliantColorPairs[mostDominantColor])

  return mostDominantColor
}

/**
 * Gets the palette for an image from color-thief and maps
 * the colors to Color instances. It also re-initializes
 * and updates the RGBToPixelCountMap so we get a fresh
 * dataset for pixel dominance
 * @param {string} image
 */
function getColorPalette (image) {
  totalPixelCount = 0
  RGBToPixelCountMap = {}

  const canvas = new CanvasImage(image)
  const imageData = canvas.getImageData()
  const pixels = imageData.data
  const pixelCount = canvas.getPixelCount()

  const palette = new Colorthief().getPaletteFromPixels(pixels, pixelCount)

  canvas.removeCanvas()

  return palette.map(color => {
    const colorWrapper = new Color(color.rgb)

    RGBToPixelCountMap[colorWrapper] = color.count
    totalPixelCount += color.count

    return colorWrapper
  })
}

/**
 * The main export that takes an image URI and optional instance
 * of color-thief and generates the palettes. Responsible for
 * building the WCAGCompliantColorPairs map and generating
 * accessible color pairings.
 *
 * Returns an object with a backgroundColor, color, and alternativeColor.
 * If there's only one potential color pairing, alternativeColor will
 * just be color.
 * @param {*} image
 */
export default function getImagePalette (src, cb) {
  totalPixelCount = 0
  RGBToPixelCountMap = {}

  const image = new Image()

  image.src = src
  image.onload = () => {
    const canvas = new CanvasImage(image)
    const imageData = canvas.getImageData()
    const pixels = imageData.data
    const pixelCount = canvas.getPixelCount()

    const worker = new Worker('./palette.worker.js', {
      type: 'module'
    })

    worker.onmessage = e => {
      const palette = e.data
      canvas.removeCanvas()

      const palettes = palette.map(color => {
        const colorWrapper = new Color(color.rgb)

        RGBToPixelCountMap[colorWrapper] = color.count
        totalPixelCount += color.count

        return colorWrapper
      })

      const WCAGCompliantColorPairs = {}

      palettes.forEach((dominantColor) => {
        const pairs = (WCAGCompliantColorPairs[dominantColor] = [])
        palettes.forEach(color => {
          let contrast = dominantColor.contrast(color)

          if (contrast > THRESHOLD_CONTRAST_RATIO) {
            /**
             * The score is determined based three things:
             *
             *  contrast:
             *     how well contrasted the color is with the dominant color.
             *  dominance:
             *    the level of dominance of the dominant color
             *    which is based on the index of the color in
             *    the palette array.
             *   range/vibrance:
             *    we want some vibrant colors
             */
            const range = getRGBRange(color)

            // If the contrast isn't high enough, lighten/darken the color so that we get a more accessible version of the color
            if (contrast < MINIMUM_CONTRAST_RATIO) {
              const delta = (MINIMUM_CONTRAST_RATIO - contrast) / 20
              let lighten = dominantColor.isDark()

              while (contrast < MINIMUM_CONTRAST_RATIO) {
                const newColor = lighten ? color.lighten(delta) : color.darken(delta)

                if (newColor.hex() === color.hex()) {
                  // If the new color is the same as the old one, we're not getting any lighter or darker so we need to stop.
                  break
                }

                const newContrast = dominantColor.contrast(newColor)

                if (newContrast < contrast) {
                  // If the new contrast is lower than the old contrast then we need to start moving the other direction in the spectrum
                  lighten = !lighten
                }

                color = newColor
                contrast = newContrast
              }
            }
            const score = contrast + range
            pairs.push({
              color,
              score,
              contrast
            })
          }
        })
      })

      const backgroundColor = getMostDominantPrimaryColor(WCAGCompliantColorPairs)

      let [color, alternativeColor, accentColor] = WCAGCompliantColorPairs[
        backgroundColor
      ]

      if (!alternativeColor) {
        alternativeColor = color
      }

      if (!accentColor) {
        accentColor = alternativeColor
      }

      cb({
        backgroundColor,
        color: color.color.hex(),
        alternativeColor: alternativeColor.color.hex(),
        negativeColor: Color(backgroundColor)[Color(backgroundColor).isLight() ? 'lighten' : 'darken'](0.8).negate().hex()
      })
    }

    worker.postMessage({
      pixels,
      pixelCount
    })
  }
}
