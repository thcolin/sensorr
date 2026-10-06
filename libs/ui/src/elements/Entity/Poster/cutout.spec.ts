import { hole } from './cutout'

describe('hole', () => {
  const picture = { left: 100, top: 50 }
  const pill = { left: 90, top: 34, width: 88, height: 32 }

  it('draws gradients only, never an image Firefox would load while the picture flickers', () => {
    hole(pill, picture, { radius: '32px', width: 88, opacity: 1, scale: 1 })
      .forEach((layer) => expect(layer.image).toMatch(/^(linear|radial)-gradient\(/))
  })

  it('places the badge in the picture and rounds it like the badge', () => {
    const layers = hole(pill, picture, { radius: '32px', width: 88, opacity: 1, scale: 1 })

    // A pill: a band between its rounded ends, four quarter discs of its half height, and a pixel over each seam
    expect(layers[0]).toEqual(expect.objectContaining({ position: '5.5px -16.0px', size: '57.0px 32.0px' }))
    expect(layers[1]).toEqual(expect.objectContaining({ position: '-10.0px -0.5px', size: '16.0px 1.0px' }))
    expect(layers.filter((layer) => layer.image.startsWith('radial')).map((layer) => `${layer.position} ${layer.size}`))
      .toEqual(['-10.0px -16.0px 16.0px 16.0px', '62.0px -16.0px 16.0px 16.0px', '-10.0px 0.0px 16.0px 16.0px', '62.0px 0.0px 16.0px 16.0px'])
  })

  it('reads a percentage radius against the smaller side', () => {
    expect(hole({ left: 100, top: 50, width: 40, height: 40 }, picture, { radius: '50%', width: 40, opacity: 1, scale: 1 })[3].size)
      .toBe('20.0px 20.0px')
  })

  it('scales a radius in the badge pixels to the screen, then to the picture pixels', () => {
    const layers = hole({ left: 100, top: 50, width: 80, height: 40 }, picture, { radius: '8px', width: 40, opacity: 1, scale: 0.5 })

    // 16px on the screen, 8px in the picture: three bands and four discs of 8px
    expect(layers).toHaveLength(7)
    expect(layers[0]).toEqual(expect.objectContaining({ position: '7.5px 0.0px', size: '25.0px 20.0px' }))
    expect(layers[3].size).toBe('8.0px 8.0px')
  })

  it('is as opaque as the badge, and cuts nothing for a badge that does not show', () => {
    expect(hole(pill, picture, { radius: '32px', width: 88, opacity: 0.5, scale: 1 })[0].image).toContain('rgba(0,0,0,0.50)')
    expect(hole(pill, picture, { radius: '32px', width: 88, opacity: 0, scale: 1 })).toBeNull()
    expect(hole(pill, picture, { radius: '32px', width: 0, opacity: 1, scale: 1 })).toBeNull()
  })
})
