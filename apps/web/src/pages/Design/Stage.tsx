import { NavLink, Navigate, Outlet, useParams } from 'react-router-dom'
import { Warning } from '@sensorr/ui'
import { stages } from './stories'

export const Redirector = ({ ...props }) => {
  const { stage } = useParams() as any
  const first = stages.find(({ slug }) => slug === stage)?.components[0]

  if (!first) {
    return (
      <Warning emoji='📭' title='No stories' subtitle={`Nothing matched "libs/ui/src/${stage}/**/*.stories.tsx"`} />
    )
  }

  return (
    <Navigate replace={true} to={first.slug} />
  )
}

const Stage = ({ ...props }) => {
  const { stage } = useParams() as any
  const scoped = stages.find(({ slug }) => slug === stage)

  return (
    <section sx={Stage.styles.element}>
      <nav sx={Stage.styles.nav}>
        {(scoped?.components || []).map(({ slug, label }) => (
          <NavLink key={slug} to={slug}>{label}</NavLink>
        ))}
      </nav>
      <Outlet />
    </section>
  )
}

Stage.styles = {
  element: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    flex: '1 1 0%',
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    flexDirection: ['row', 'column'],
    flex: 'none',
    minWidth: ['100%', '18em'],
    maxWidth: ['100%', '18em'],
    overflowX: ['auto', 'hidden'],
    overflowY: ['hidden', 'auto'],
    paddingY: [12, 9],
    backgroundColor: 'grayLighter',
    'a': {
      fontFamily: 'heading',
      color: 'text',
      paddingX: 6,
      paddingY: 9,
      fontSize: 5,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      '&:hover': {
        backgroundColor: 'grayLight',
      },
      '&.active': {
        backgroundColor: 'primary',
        color: 'whitePure',
      },
    },
  },
}

export default Stage
