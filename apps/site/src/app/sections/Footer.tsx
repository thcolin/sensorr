import { GITHUB } from '../data'

const LINKS = [
  { label: 'GitHub', href: GITHUB },
  { label: 'Documentation', href: `${GITHUB}#documentation` },
  { label: 'Releases', href: `${GITHUB}/releases` },
  { label: 'Sponsor', href: 'https://github.com/sponsors/thcolin' },
  { label: 'MIT License', href: `${GITHUB}/blob/main/LICENSE` },
]

export const Footer = () => (
  <footer sx={Footer.styles.element}>
    <div sx={Footer.styles.content}>
      <p sx={Footer.styles.brand}>
        <span aria-hidden='true'>🍿📼</span> sensorr
        <span sx={Footer.styles.tagline}>Your Friendly Digital Video Recorder</span>
      </p>
      <nav aria-label='Sensorr'>
        <ul sx={Footer.styles.links}>
          {LINKS.map(({ label, href }) => (
            <li key={label}>
              <a href={href} sx={Footer.styles.link}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <p sx={Footer.styles.attribution}>
        This product uses the <a href='https://www.themoviedb.org/' sx={Footer.styles.link}>TMDB</a> API
        but is not endorsed or certified by TMDB.
      </p>
    </div>
  </footer>
)

Footer.styles = {
  element: {
    marginTop: 0,
    borderTop: '1px solid',
    borderColor: 'grayDark',
    color: 'textLight',
    lineHeight: 'body',
  },
  content: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    flexWrap: 'wrap',
    alignItems: ['flex-start', 'baseline'],
    justifyContent: 'space-between',
    gap: 6,
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
    paddingY: 2,
  },
  brand: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: 11,
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 5,
  },
  tagline: {
    fontFamily: 'body',
    fontWeight: 'normal',
    fontSize: 5,
  },
  links: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 9,
    margin: '0px',
    padding: '0px',
    fontSize: 6,
    listStyle: 'none',
  },
  link: {
    color: 'inherit',
    textDecoration: 'underline',
    textDecorationColor: 'grayDarker',
    textUnderlineOffset: '0.2em',
    transition: 'text-decoration-color 200ms ease-in-out',
    ':hover': {
      textDecorationColor: 'currentColor',
    },
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: '2px',
    },
  },
  attribution: {
    flexBasis: '100%',
    margin: '0px',
    fontSize: 6,
    textWrap: 'pretty',
  },
}
