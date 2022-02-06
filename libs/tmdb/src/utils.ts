import { Movie } from './interfaces'

const judge = ({ vote_average = 0 }: Movie) => {
  if (!vote_average) {
    return '🤷'
  } else if (vote_average < 5) {
    return '👎'
  } else if (vote_average < 7) {
    return '👍'
  } else if (vote_average < 7.5) {
    return '👏'
  } else if (vote_average < 8) {
    return '🙌'
  } else {
    return '🙏'
  }
}

const sortCredits = (credits, priorized = [], includes: ('crew' | 'cast')[] = ['cast', 'crew']) => includes
  .reduce((acc, key) => [...acc, ...((credits || {})[key] || [])], [])
  .sort((a, b) => +priorized.includes(`${b.id}`) - +priorized.includes(`${a.id}`))
  .sort((a, b) => b.job === 'Director' ? 1 : a.job === 'Director' ? -1 : 0)
  .map((credit, index, self) => ({
    ...credit,
    override: self
      .filter((c) => c.id === credit.id)
      .filter((c)  => c.job || c.character)
      .map((c) => c.job || `"${c.character}"`)
      .join(', '),
    department: self
      .filter((c) => c.id === credit.id)
      .map((c) => c.department)
  }))
  .filter((a, index, self) => index === self.findIndex(b => a.id === b.id))

export default {
  judge,
  sortCredits,
}
