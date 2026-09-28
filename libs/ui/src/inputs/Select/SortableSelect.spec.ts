import { drop } from './SortableSelect'

describe('drop', () => {
  const prefer = (value, rank = undefined) => ({ value, group: 'prefer', rank })
  const values = [{ label: '⭐' }, prefer('VF2', 0), prefer('VFF', 1), prefer('VFQ', 2), prefer('MULTi', 3)]
  const ranks = (next) => next.filter(v => v.value).map(({ value, rank }) => `${value}:${rank}`)

  it('puts a value dropped on the middle of another at its rank', () => {
    expect(ranks(drop(values, 'VFF', 'VF2', 'rank', 'fresh'))).toEqual(['VF2:0', 'VFF:0', 'VFQ:2', 'MULTi:3'])
  })

  it('gives both values a fresh rank when the target has none', () => {
    expect(ranks(drop([prefer('A'), prefer('B'), prefer('C')], 'C', 'A', 'rank', 'fresh'))).toEqual(['A:fresh', 'C:fresh', 'B:undefined'])
  })

  it('joins the rank of the two values it lands between when they share one', () => {
    const grouped = [prefer('VF2', 0), prefer('VFF', 0), prefer('VFQ', 2)]
    expect(ranks(drop(grouped, 'VFQ', 'VF2', 'after', 'fresh'))).toEqual(['VF2:0', 'VFQ:0', 'VFF:0'])
  })

  it('takes a value out of its rank when dropped on an outer edge', () => {
    const grouped = [prefer('VF2', 0), prefer('VFF', 0), prefer('VFQ', 2)]
    expect(ranks(drop(grouped, 'VF2', 'VFQ', 'after', 'fresh'))).toEqual(['VFF:0', 'VFQ:2', 'VF2:undefined'])
    expect(ranks(drop(grouped, 'VFF', 'VF2', 'before', 'fresh'))).toEqual(['VFF:undefined', 'VF2:0', 'VFQ:2'])
  })

  it('never ranks a value outside the prefer group', () => {
    const mixed = [prefer('VF2', 0), prefer('VFF', 0), { value: 'VO', group: 'avoid' }]
    expect(ranks(drop(mixed, 'VO', 'VF2', 'after', 'fresh'))).toEqual(['VF2:0', 'VO:undefined', 'VFF:0'])
  })
})
