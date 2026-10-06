import Color from 'color'
import { ambianceOf, readableOn } from '../ambiance'

// What `Colorthief` finds in the w92 posters of Spider-Man: Brand New Day, Barbie and Insidious
const posters = {
  spiderman: [['#c5252d', 117], ['#8a1c1f', 255], ['#23090b', 540], ['#d7bda2', 67], ['#2c6798', 57], ['#899eab', 22], ['#123762', 71], ['#3c5764', 31], ['#5d0f10', 110]],
  barbie: [['#3cc5fa', 413], ['#eed2e2', 488], ['#c827a1', 89], ['#78d7f7', 75], ['#cb7a55', 31], ['#e9ab85', 67], ['#b472b8', 29], ['#140e17', 14], ['#f59dca', 64]],
  insidious: [['#6f8d84', 54], ['#9ea8a2', 47], ['#0d110f', 789], ['#596660', 147], ['#37564e', 148], ['#312f2a', 64], ['#872c42', 5], ['#6c7c7c', 4], ['#284444', 12]],
}

const ambiance = (poster) => ambianceOf(posters[poster].map(([hex, count]) => ({ hex, count })))
const hue = (hex) => Color(hex).lch().array()[2]

describe('ambianceOf', () => {
  it('reads every text color on its background', () => {
    for (const poster of Object.keys(posters)) {
      const { backgroundColor, color, alternativeColor, negativeColor } = ambiance(poster)

      for (const text of [color, alternativeColor, negativeColor]) {
        expect(Color(text).contrast(Color(backgroundColor))).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('tints a dark poster with its colors and keeps its second hue', () => {
    const { backgroundColor, color, alternativeColor } = ambiance('spiderman')

    expect(Color(backgroundColor).isDark()).toBe(true)
    expect(hue(backgroundColor)).toBeLessThan(45)
    expect(hue(color)).toBeLessThan(45)
    expect(hue(alternativeColor)).toBeGreaterThan(230)
  })

  it('keeps a light poster light', () => {
    expect(Color(ambiance('barbie').backgroundColor).isLight()).toBe(true)
  })

  it('moves a color away from its background until it reads, keeping its hue', () => {
    // The Matrix ticket: its subtitle's green on the poster's green
    const color = readableOn('#A4D1AF', '#60AE78', 4.5)

    expect(Color(color).contrast(Color('#60AE78'))).toBeGreaterThanOrEqual(4.5)
    expect(Math.abs(hue(color) - hue('#A4D1AF'))).toBeLessThan(10)
  })
})
