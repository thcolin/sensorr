import { landedOf } from './arrivals'

describe('landedOf', () => {
  it('dates a known episode getting its first file', () => {
    expect(landedOf({ 1: { files: [{}] } }, [{ _id: 1, files: [] }])).toEqual(['1'])
  })

  it('never dates an episode created with its files, one that held a file, one dated before, or one without file', () => {
    expect(landedOf({
      1: { files: [{}] },
      2: { files: [{}] },
      3: { files: [{}] },
      4: { files: [] },
    }, [{ _id: 2, files: [{}] }, { _id: 3, files: [], files_at: 1 }, { _id: 4, files: [] }])).toEqual([])
  })
})
