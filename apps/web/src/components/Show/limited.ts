// A person's credits mount 100+ show cards at once, each asking TMDB or Sensorr for its progress, and TMDB refuses
// such a burst with 429s. 20 at a time, like the calendar's pool, fills a screen of cards in one wave and keeps
// TMDB answering
export const LIMIT = 20

const waiting = new Set<() => void>()
let running = 0

// Runs `task` once fewer than LIMIT of them run, in the order asked. A card gone before its turn leaves the line
export const limited = <T>(task: () => Promise<T>, signal: AbortSignal): Promise<T> => new Promise((resolve, reject) => {
  const leave = () => {
    waiting.delete(start)
    reject(signal.reason)
  }

  const start = () => {
    waiting.delete(start)
    signal.removeEventListener('abort', leave)
    running++
    task().then(resolve, reject).finally(() => {
      running--
      waiting.values().next().value?.()
    })
  }

  if (running < LIMIT) {
    start()
  } else {
    waiting.add(start)
    signal.addEventListener('abort', leave, { once: true })
  }
})
