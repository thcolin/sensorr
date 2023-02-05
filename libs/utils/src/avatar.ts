import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'

const cache = {}

export const avatar = (seed) => {
  cache[seed] = cache[seed] || createAvatar(bottts, {
    seed,
    size: 128,
    scale: 70,
    backgroundColor: ['F6F6F6'],
  }).toDataUriSync()

  return cache[seed]
}
