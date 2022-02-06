import Colorthief from './colorthief'
import Color from 'color'

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
function getRGBRange(color) {
  const rgb = color
    .rgb()
    .array()
    .sort((a, b) => b - a)
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
function getPixelDominance(color) {
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
function calculateTotalPairScore(pairs) {
  return pairs.reduce((score, color) => score + color.score, 0)
}

/**
 * Return a new array of pairs, sorted by score.
 * @param {*} pairs
 */
function sortPairsByScore(pairs) {
  pairs.sort((a, b) => (a.score === b.score ? 0 : a.score > b.score ? -1 : 1))
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
function getMostDominantPrimaryColor(WCAGCompliantColorPairs) {
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

addEventListener('message', ({ data: { pixels, pixelCount } }) => {
  totalPixelCount = 0
  RGBToPixelCountMap = {}

  const palette = new Colorthief().getPaletteFromPixels(pixels, pixelCount)

  const palettes = palette.map((color) => {
    const colorWrapper = new Color(color.rgb)
    RGBToPixelCountMap[colorWrapper] = color.count
    totalPixelCount += color.count
    return colorWrapper
  })

  const WCAGCompliantColorPairs = {}

  palettes.forEach((dominantColor) => {
    const pairs = (WCAGCompliantColorPairs[dominantColor] = [])
    palettes.forEach((color) => {
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
          contrast,
        })
      }
    })
  })

  const backgroundColor = getMostDominantPrimaryColor(WCAGCompliantColorPairs)

  let [color, alternativeColor, accentColor] = WCAGCompliantColorPairs[backgroundColor]

  if (!alternativeColor) {
    alternativeColor = color
  }

  if (!accentColor) {
    accentColor = alternativeColor
  }

  postMessage({
    backgroundColor,
    color: color.color.hex(),
    alternativeColor: alternativeColor.color.hex(),
    accentColor: accentColor.color.hex(),
    negativeColor: Color(backgroundColor)
      [Color(backgroundColor).isLight() ? 'lighten' : 'darken'](0.8)
      .negate()
      .hex(),
  })
})
