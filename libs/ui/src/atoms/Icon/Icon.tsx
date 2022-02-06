import { memo } from 'react'
import { animations } from '@sensorr/theme'

const SearchIcon = ({ ...props }) => (
  <svg {...props} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 129 129'>
    <path
      fill='currentColor'
      d='M51.6 96.7c11 0 21-3.9 28.8-10.5l35 35c.8.8 1.8 1.2 2.9 1.2s2.1-.4 2.9-1.2c1.6-1.6 1.6-4.2 0-5.8l-35-35c6.5-7.8 10.5-17.9 10.5-28.8 0-24.9-20.2-45.1-45.1-45.1-24.8 0-45.1 20.3-45.1 45.1 0 24.9 20.3 45.1 45.1 45.1zm0-82c20.4 0 36.9 16.6 36.9 36.9C88.5 72 72 88.5 51.6 88.5S14.7 71.9 14.7 51.6c0-20.3 16.6-36.9 36.9-36.9z'
    />
  </svg>
)

const ClearIcon = ({ ...props }) => (
  <svg {...props} sx={ClearIcon.styles.element} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'>
    <path
      fill='currentColor'
      opacity={0.2}
      d='M10 0a10 10 0 1 0 10 10A10 10 0 0 0 10 0zm5.66 14.24l-1.41 1.41L10 11.41l-4.24 4.25-1.42-1.42L8.59 10 4.34 5.76l1.42-1.42L10 8.59l4.24-4.24 1.41 1.41L11.41 10z'
    />
  </svg>
)

ClearIcon.styles = {
  element: {
    color: 'black',
  },
}

const SpinnerIcon = ({ ...props }) => (
  <div {...props} sx={SpinnerIcon.styles.element}>
    <div sx={SpinnerIcon.styles.circle}></div>
    <div sx={SpinnerIcon.styles.second}></div>
  </div>
)

SpinnerIcon.styles = {
  element: {
    height: '2.5rem',
    width: '2.5rem',
    position: 'relative',
    margin: '0 auto',
  },
  circle: {
    height: '100%',
    width: '100%',
    borderRadius: '50%',
    opacity: 0.6,
    position: 'absolute',
    backgroundColor: 'text',
    top: 12,
    left: 12,
    animation: `${animations.bounce} 2.0s infinite ease-in-out`,
  },
  second: {
    height: '100%',
    width: '100%',
    borderRadius: '50%',
    opacity: 0.6,
    position: 'absolute',
    backgroundColor: 'text',
    top: 12,
    left: 12,
    animation: `${animations.bounce} 2.0s infinite ease-in-out`,
    animationDelay: '-1s',
  },
}

const MoreIcon = ({ ...props }) => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' {...props}>
    <path fill='currentColor' opacity={0.5} d='M256 273L120.4 409c-9.2 9.3-24.3 9.4-33.6.2l-.2-.2L64 386.4c-9.4-9.3-9.4-24.5 0-33.9l96.1-96.4L64 159.7c-9.4-9.3-9.4-24.5 0-33.9L86.4 103c9.2-9.3 24.3-9.4 33.6-.2l.2.2 135.6 136c9.4 9.3 9.5 24.4.2 33.9.1 0 0 .1 0 .1z' />
    <path fill='currentColor' d='M447.9 273L312.3 409c-9.2 9.3-24.3 9.4-33.6.2l-.2-.2-22.5-22.7c-9.4-9.3-9.4-24.5 0-33.9l96.1-96.4-96-96.5c-9.4-9.3-9.4-24.5 0-33.9l22.5-22.6c9.2-9.3 24.3-9.4 33.6-.2l.2.2L448 239c9.4 9.4 9.3 24.6-.1 34z' />
  </svg>
)

const FiltersIcon = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
    <path fill="currentColor" d="M496 72H288V48c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v24H16C7.2 72 0 79.2 0 88v16c0 8.8 7.2 16 16 16h208v24c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-24h208c8.8 0 16-7.2 16-16V88c0-8.8-7.2-16-16-16zm0 320H160v-24c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v24H16c-8.8 0-16 7.2-16 16v16c0 8.8 7.2 16 16 16h80v24c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-24h336c8.8 0 16-7.2 16-16v-16c0-8.8-7.2-16-16-16zm0-160h-80v-24c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v24H16c-8.8 0-16 7.2-16 16v16c0 8.8 7.2 16 16 16h336v24c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-24h80c8.8 0 16-7.2 16-16v-16c0-8.8-7.2-16-16-16z"/>
  </svg>
)

const CheckIcon = ({ direction, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
    <path fill="currentColor" d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"/>
  </svg>
)

const SortIcon = ({ direction, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
    {{
      true: <path fill="currentColor" d="M500 128h-44v336c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16V128h-44c-4.8 0-9.1-2.8-11-7.2-1.9-4.4-1-9.5 2.3-13l68-72c2.3-2.4 5.4-3.8 8.7-3.8s6.5 1.4 8.7 3.8l68 72c3.3 3.5 4.2 8.6 2.3 13-1.9 4.3-6.2 7.2-11 7.2zM109.7 232h164.6c7.6 0 13.7 7.2 13.7 16v16c0 8.8-6.1 16-13.7 16H109.7c-7.6 0-13.7-7.2-13.7-16v-16c0-8.8 6.2-16 13.7-16zM16 72h256c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H16c-8.8 0-16-7.2-16-16V88c0-8.8 7.2-16 16-16zm185.6 319h76.8c5.3 0 9.6 7.2 9.6 16v16c0 8.8-4.3 16-9.6 16h-76.8c-5.3 0-9.6-7.2-9.6-16v-16c0-8.8 4.3-16 9.6-16z"/>,
      false: <path fill="currentColor" d="M500 384h-44V48c0-8.8-7.2-16-16-16h-16c-8.8 0-16 7.2-16 16v336h-44c-4.8 0-9.1 2.8-11 7.2s-1 9.5 2.3 13l68 72c2.3 2.4 5.4 3.8 8.7 3.8s6.5-1.4 8.7-3.8l68-72c3.3-3.5 4.2-8.6 2.3-13s-6.2-7.2-11-7.2zM109.7 280h164.6c7.6 0 13.7-7.2 13.7-16v-16c0-8.8-6.1-16-13.7-16H109.7c-7.6 0-13.7 7.2-13.7 16v16c0 8.8 6.2 16 13.7 16zM16 440h256c8.8 0 16-7.2 16-16v-16c0-8.8-7.2-16-16-16H16c-8.8 0-16 7.2-16 16v16c0 8.8 7.2 16 16 16zm185.6-319h76.8c5.3 0 9.6-7.2 9.6-16V89c0-8.8-4.3-16-9.6-16h-76.8c-5.3 0-9.6 7.2-9.6 16v16c0 8.8 4.3 16 9.6 16z"/>,
    }[`${!!direction}`]}
  </svg>
)

const RefreshIcon = ({ ...props }) => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' {...props}>
    <path fill='currentColor' d='M483.515 28.485L431.35 80.65C386.475 35.767 324.485 8 256.001 8 119.34 8 7.9 119.525 8 256.185 8.1 393.067 119.095 504 256 504c63.926 0 122.202-24.187 166.178-63.908 5.113-4.618 5.353-12.561.482-17.433l-19.738-19.738c-4.498-4.498-11.753-4.785-16.501-.552C351.787 433.246 306.105 452 256 452c-108.321 0-196-87.662-196-196 0-108.321 87.662-196 196-196 54.163 0 103.157 21.923 138.614 57.386l-54.128 54.129c-7.56 7.56-2.206 20.485 8.485 20.485H492c6.627 0 12-5.373 12-12V36.971c0-10.691-12.926-16.045-20.485-8.486z' />
  </svg>
)

const PlayIcon = ({ ...props }) => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' {...props}>
    <path fill='currentColor' d='M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z' />
  </svg>
)

const ChevronIcon = ({ direction, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
    {{
      true: <path fill="currentColor" d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z" />,
      false: <path fill="currentColor" d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z" />,
    }[`${!!direction}`]}
  </svg>
)

const LiveIcon = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props} sx={LiveIcon.styles.element}>
    <circle xmlns="http://www.w3.org/2000/svg" cx="256" cy="256" r="256" fill="#E32626" />
  </svg>
)

LiveIcon.styles = {
  element: {
    animation: `1.5s linear infinite ${animations.blink}`,
  }
}

export interface IconProps extends React.HTMLAttributes<HTMLOrSVGElement> {
  value: 'search' | 'clear' | 'spinner' | 'more' | 'filters' | 'check' | 'sort' | 'refresh' | 'play' | 'chevron' | 'live'
  [key: string]: any
}

const UiIcon = ({ value, ...props }: IconProps) =>
  ({
    search: <SearchIcon {...props} />,
    clear: <ClearIcon {...props} />,
    spinner: <SpinnerIcon {...props} />,
    more: <MoreIcon {...props} />,
    filters: <FiltersIcon {...props} />,
    check: <CheckIcon {...props as any} />,
    sort: <SortIcon {...props as any} />,
    refresh: <RefreshIcon {...props} />,
    play: <PlayIcon {...props} />,
    chevron: <ChevronIcon {...props as any} />,
    live: <LiveIcon {...props as any} />,
  }[value] || null)

export const Icon = memo(UiIcon)
