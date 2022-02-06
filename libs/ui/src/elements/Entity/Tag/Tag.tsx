import { memo } from 'react'
import { Link } from 'react-router-dom'

const UITag = ({ details, link, ...props }) => (
  <Link to={link} sx={UITag.styles.element}>{details.title}</Link>
)

UITag.styles = {
  element: {
    variant: 'link.reset',
    backgroundColor: 'primary',
    color: 'white !important',
    borderRadius: '1.5em',
    fontFamily: 'monospace',
    fontSize: 6,
    fontWeight: 'semibold',
    paddingX: 4,
    paddingY: 8,
  },
}

export const Tag = memo(UITag)
