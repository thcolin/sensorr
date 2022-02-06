import nanobounce from 'nanobounce'

export const scrollToTop = (callback = null) => {
  const debounce = nanobounce(200)

  const onScroll = () => debounce(() => {
    if (window.pageYOffset === 0) {
      window.removeEventListener('scroll', onScroll)
      if (callback) {
        callback()
      }
    }
  })

  window.addEventListener('scroll', onScroll)
  onScroll()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
