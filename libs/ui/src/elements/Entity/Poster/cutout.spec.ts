import { hole } from './cutout'

describe('hole', () => {
  const picture = { left: 100, top: 50 }
  const pill = { left: 90, top: 34, width: 88, height: 32 }

  it('places the badge in the picture and rounds it like the badge', () => {
    expect(hole(pill, picture, { radius: '32px', width: 88, opacity: 1, scale: 1 }))
      .toBe('<rect x="-10.0" y="-16.0" width="88.0" height="32.0" rx="16.0" fill-opacity="1.00"/>')
  })

  it('reads a percentage radius against the smaller side', () => {
    expect(hole({ left: 100, top: 50, width: 40, height: 40 }, picture, { radius: '50%', width: 40, opacity: 1, scale: 1 }))
      .toContain('rx="20.0"')
  })

  it('scales a radius in the badge pixels to the screen, then to the picture pixels', () => {
    expect(hole({ left: 100, top: 50, width: 80, height: 40 }, picture, { radius: '8px', width: 40, opacity: 1, scale: 0.5 }))
      .toBe('<rect x="0.0" y="0.0" width="40.0" height="20.0" rx="8.0" fill-opacity="1.00"/>')
  })

  it('is as opaque as the badge, and cuts nothing for a badge that does not show', () => {
    expect(hole(pill, picture, { radius: '32px', width: 88, opacity: 0.5, scale: 1 })).toContain('fill-opacity="0.50"')
    expect(hole(pill, picture, { radius: '32px', width: 88, opacity: 0, scale: 1 })).toBeNull()
    expect(hole(pill, picture, { radius: '32px', width: 0, opacity: 1, scale: 1 })).toBeNull()
  })
})
