export type LogoTone = 'as-is' | 'invert' | 'glow' | 'halo'

const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4

// The relative luminance of the page's near black
const PAGE = 0.0015

// Under 3:1 against the background, the contrast a large graphic needs, a pixel is lost
const isLost = (luminance: number, background: number) =>
  (Math.max(luminance, background) + 0.05) / (Math.min(luminance, background) + 0.05) < 3

// Mostly lost and gray, a logo turns to the other end; mostly lost in color, it gets a wide halo; lost in part, an
// outline. The background is the page's, unless the logo is drawn on another, as the drawer's poster colors
export const toneOfPixels = (data: Uint8ClampedArray | number[], background = PAGE): LogoTone => {
  let count = 0, lost = 0, saturation = 0

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) {
      continue
    }

    const [r, g, b] = [data[i], data[i + 1], data[i + 2]].map((value) => value / 255)
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    count++
    lost += isLost(0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b), background) ? 1 : 0
    saturation += max === 0 ? 0 : (max - min) / max
  }

  if (!count || lost / count <= 0.25) {
    return 'as-is'
  }

  return lost / count > 0.5 && saturation / count < 0.2 ? 'invert' : lost / count > 0.4 ? 'halo' : 'glow'
}

export const toneOfImage = (image: HTMLImageElement, background = PAGE): LogoTone => {
  const width = 64
  const height = Math.max(1, Math.round(width * image.naturalHeight / Math.max(1, image.naturalWidth)))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  try {
    context.drawImage(image, 0, 0, width, height)
    return toneOfPixels(context.getImageData(0, 0, width, height).data, background)
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

// On a light background, the halos are dark
const LIGHT_LOGO_FILTERS: Record<LogoTone, string | undefined> = {
  ...LOGO_FILTERS,
  glow: 'drop-shadow(0 0 1px hsla(0, 0%, 0%, 0.8)) drop-shadow(0 0 4px hsla(0, 0%, 0%, 0.25))',
  halo: 'drop-shadow(0 0 1px hsla(0, 0%, 0%, 0.9)) drop-shadow(0 0 3px hsla(0, 0%, 0%, 0.6)) drop-shadow(0 0 10px hsla(0, 0%, 0%, 0.35))',
}

export const logoFilterOf = (tone: LogoTone, background = PAGE) => (background > 0.18 ? LIGHT_LOGO_FILTERS : LOGO_FILTERS)[tone]
