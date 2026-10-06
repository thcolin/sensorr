import Color from 'color'

// AA asks 4.5, a margin keeps a color that antialiasing dims above it. Higher, a red or a blue on a dark background
// can only climb to a pale pink or a pale blue
const MINIMUM_CONTRAST_RATIO = 4.6

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// `color` clamps what falls out of sRGB: a color is drawable when its LCH survives the round trip
const inGamut = (l, c, h) => {
  const [L, C] = Color.lch(l, c, h).rgb().lch().array()
  return Math.abs(L - l) < 0.5 && Math.abs(C - c) < 1
}

// The closest drawable color to an LCH, by lowering its chroma and keeping its lightness and hue
const drawable = (l, c, h) => {
  let chroma = c

  while (chroma > 0 && !inGamut(l, chroma, h)) {
    chroma -= 1
  }

  return Color.lch(l, Math.max(0, chroma), h)
}

const hueDistance = (a, b) => {
  const distance = Math.abs(a - b) % 360
  return distance > 180 ? 360 - distance : distance
}

// A hue keeps its chroma, raised by half: a swatch averages the poster's color with what surrounds it, and reads
// duller on a flat surface. It only moves in lightness, away from the background, until it reads on it
const readable = ([l, c, h], background, dark, ratio = MINIMUM_CONTRAST_RATIO) => {
  for (let L = l; dark ? L <= 100 : L >= 0; L += dark ? 1 : -1) {
    const color = drawable(L, c * 1.5, h)

    if (color.contrast(background) >= ratio) {
      return color
    }
  }

  return dark ? Color('#FFFFFF') : Color('#000000')
}

// A color moved in lightness only, keeping its hue and chroma, until it reads on a background: by the smallest step,
// lighter or darker, since a mid background as a vivid red reads under white only in dark
export const readableOn = (color, background, ratio = MINIMUM_CONTRAST_RATIO) => {
  const surface = Color(background)
  const [l, c, h] = Color(color).lch().array()

  for (let step = 0; step <= 100; step++) {
    for (const L of [l + step, l - step]) {
      const candidate = L >= 0 && L <= 100 && drawable(L, c, h)

      if (candidate && candidate.contrast(surface) >= ratio) {
        return candidate.hex()
      }
    }
  }

  return surface.isDark() ? '#FFFFFF' : '#000000'
}

/**
 * The poster's colors as a surface to read on, from the swatches `Colorthief` found and their pixel count, and the
 * accents it found among the poster's saturated pixels alone, with the share of the poster they cover:
 *  - the background keeps the lightness of the poster's dominant swatch, so a dark poster stays dark and a light one
 *    light, and takes the hue of its most present colorful swatch, so the black of a red poster turns oxblood
 *  - the color is its most vivid swatch or accent, moved in lightness only until it reads on the background: a red
 *    title on a dark poster keeps the red of its letters, that the whole poster's swatches average with the dark
 *  - the alternative color is the most vivid swatch of another hue, the poster's second color, when it has one
 *  - the negative color, for long text, is near white or near black, tinted by the background's hue
 */
export const ambianceOf = (swatches, accents = []) => {
  const total = swatches.reduce((total, { count }) => total + count, 0)
  const colors = swatches.map(({ hex, count }) => ({ lch: Color(hex).lch().array(), share: count / total }))
  const [dominant] = [...colors].sort((a, b) => b.share - a.share)

  const presence = ({ lch: [, c], share }) => c * share
  const vividness = ({ lch: [, c], share }) => c * c * Math.sqrt(share)
  const colorful = colors.filter(({ lch: [, c], share }) => c > 12 && share > 0.02)

  const mood = dominant.lch[1] > 12 ? dominant : [...colorful].sort((a, b) => presence(b) - presence(a))[0] || dominant
  const dark = colors.reduce((lightness, { lch: [l], share }) => lightness + l * share, 0) < 50

  const [, moodChroma, moodHue] = mood.lch
  const backgroundColor = drawable(
    dark ? clamp(dominant.lch[0], 8, 16) : clamp(dominant.lch[0], 84, 94),
    clamp(moodChroma * (dark ? 0.6 : 0.3), dominant.lch[1], dark ? 26 : 28),
    moodHue,
  )

  const vivid = [
    ...colorful,
    ...accents.map(({ hex, share }) => ({ lch: Color(hex).lch().array(), share })).filter(({ lch: [, c], share }) => c > 30 && share > 0.005),
  ].sort((a, b) => vividness(b) - vividness(a))
  const main = vivid[0] || mood
  const other = vivid.find(({ lch: [, c, h], share }) => c > 20 && share > 0.03 && hueDistance(h, main.lch[2]) > 45)

  const color = readable(main.lch, backgroundColor, dark)
  const alternativeColor = other
    ? readable(other.lch, backgroundColor, dark)
    // Without a second hue, the color's own, a step further from the background and barely less saturated
    : readable([color.lch().array()[0] + (dark ? 12 : -12), main.lch[1] * 0.8, main.lch[2]], backgroundColor, dark)
  const negativeColor = drawable(dark ? 94 : 14, 6, moodHue)

  return {
    backgroundColor: backgroundColor.hex(),
    color: color.hex(),
    alternativeColor: alternativeColor.hex(),
    accentColor: alternativeColor.hex(),
    colorfulColor: color.hex(),
    negativeColor: negativeColor.hex(),
  }
}
