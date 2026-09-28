import { toneOfPixels } from './tone'

const pixels = (...rgba: number[][]) => rgba.flat()

describe('toneOfPixels', () => {
  it('leaves a light logo as it is', () => {
    expect(toneOfPixels(pixels([250, 250, 250, 255], [230, 40, 40, 255]))).toBe('as-is')
  })

  it('turns a dark gray logo white, and gives a dark colored one a halo', () => {
    expect(toneOfPixels(pixels([20, 20, 20, 255], [40, 40, 40, 255]))).toBe('invert')
    expect(toneOfPixels(pixels([90, 10, 10, 255], [80, 20, 5, 255]))).toBe('halo')
  })

  it('outlines a logo dark in part, whatever its highlights', () => {
    expect(toneOfPixels(pixels([10, 20, 60, 255], [240, 240, 255, 255], [230, 235, 250, 255]))).toBe('glow')
    expect(toneOfPixels(pixels([10, 20, 60, 255], [15, 25, 70, 255], [240, 240, 255, 255], [230, 235, 250, 255]))).toBe('halo')
  })

  it('reads the drawn pixels only, not the transparent ones', () => {
    expect(toneOfPixels(pixels([0, 0, 0, 0], [0, 0, 0, 10], [255, 255, 255, 255]))).toBe('as-is')
    expect(toneOfPixels(pixels([0, 0, 0, 0]))).toBe('as-is')
  })
})
