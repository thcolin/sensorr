export type LogoTone = 'as-is' | 'invert' | 'glow' | 'halo'

const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4

// Under 3:1 against the page's near black (0.0015), the contrast a large graphic needs, a pixel is lost
const DARK = 3 * (0.0015 + 0.05) - 0.05

// Mostly lost and gray, a logo turns white; mostly lost in color, it gets a wide light halo; lost in part, an outline
export const toneOfPixels = (data: Uint8ClampedArray | number[]): LogoTone => {
  let count = 0, dark = 0, saturation = 0

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) {
      continue
    }

    const [r, g, b] = [data[i], data[i + 1], data[i + 2]].map((value) => value / 255)
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    count++
    dark += 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) < DARK ? 1 : 0
    saturation += max === 0 ? 0 : (max - min) / max
  }

  if (!count || dark / count <= 0.25) {
    return 'as-is'
  }

  return dark / count > 0.5 && saturation / count < 0.2 ? 'invert' : dark / count > 0.4 ? 'halo' : 'glow'
}

export const toneOfImage = (image: HTMLImageElement): LogoTone => {
  const width = 64
  const height = Math.max(1, Math.round(width * image.naturalHeight / Math.max(1, image.naturalWidth)))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  try {
    context.drawImage(image, 0, 0, width, height)
    return toneOfPixels(context.getImageData(0, 0, width, height).data)
  } catch {
    // A tainted canvas reads nothing: the logo is drawn as it is
    return 'as-is'
  }
}

export const LOGO_FILTERS: Record<LogoTone, string | undefined> = {
  'as-is': undefined,
  invert: 'invert(1)',
  glow: 'drop-shadow(0 0 1px hsla(0, 0%, 100%, 0.8)) drop-shadow(0 0 4px hsla(0, 0%, 100%, 0.25))',
  halo: 'drop-shadow(0 0 1px hsla(0, 0%, 100%, 0.9)) drop-shadow(0 0 3px hsla(0, 0%, 100%, 0.6)) drop-shadow(0 0 10px hsla(0, 0%, 100%, 0.35))',
}
