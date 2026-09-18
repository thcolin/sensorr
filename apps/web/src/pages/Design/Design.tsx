import { NavLink, Navigate, Outlet, Route } from 'react-router-dom'
import { Warning } from '@sensorr/ui'
import { stages } from './stories'
import Stage, { Redirector } from './Stage'
import Component from './Component'

const Design = ({ ...props }) => (
  <section sx={Design.styles.element}>
    <nav sx={Design.styles.nav}>
      <h1>Design</h1>
      <div>
        {stages.map(({ slug, label }) => (
          <NavLink key={slug} to={slug}>{label}</NavLink>
        ))}
      </div>
    </nav>
    {!stages.length ? (
      <Warning emoji='📭' title='No stories' subtitle='Nothing matched "libs/ui/src/**/*.stories.tsx"' />
    ) : (
      <Outlet />
    )}
  </section>
)

Design.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0%',
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    paddingX: 4,
    backgroundColor: 'grayLighter',
    '>h1': {
      margin: 12,
      paddingY: 4,
      fontSize: 2,
    },
    '>div': {
      display: 'flex',
      flex: 1,
      overflowX: 'auto',
      'a': {
        fontFamily: 'heading',
        color: 'text',
        paddingX: 6,
        paddingY: 4,
        fontSize: 4,
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
  },
}

export const routes = (
  <Route path='/design' element={<Design />}>
    {!!stages.length && <Route path='' element={<Navigate replace={true} to={stages[0].slug} />} />}
    <Route path=':stage' element={<Stage />}>
      <Route path='' element={<Redirector />} />
      <Route path=':component' element={<Component />} />
    </Route>
  </Route>
)

export default Design
