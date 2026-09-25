// One run of a command at a time: the lock is refused while it is active, and releasing it twice is harmless
export const lockOf = (running: Set<string>, name: string): (() => void) | null => {
  if (running.has(name)) {
    return null
  }

  running.add(name)
  return () => {
    running.delete(name)
  }
}
