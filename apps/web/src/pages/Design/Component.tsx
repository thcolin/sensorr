import { useParams } from 'react-router-dom'
import { Warning } from '@sensorr/ui'
import { useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { stages } from './stories'
import Boundary from './Boundary'

const Component = ({ ...props }) => {
  const { stage, component } = useParams() as any
  const scoped = stages.find(({ slug }) => slug === stage)?.components.find(({ slug }) => slug === component)
  useTitle(['Design', scoped?.title || component].filter(part => part).join(' - '))

  return (
    <Body>
      {!scoped ? (
        <Warning emoji='📭' title='Unknown component' subtitle={`No story titled "${component}" under "libs/ui/src/${stage}"`} />
      ) : (
        <section sx={Component.styles.element}>
          {scoped.stories.map(story => (
            <figure key={story.key} sx={Component.styles.story[story.layout]}>
              <div sx={Component.styles.canvas[story.layout]}>
                <Boundary name={story.name}>
                  <story.render {...story.args} />
                </Boundary>
              </div>
              <figcaption sx={Component.styles.caption}>{story.name}</figcaption>
            </figure>
          ))}
        </section>
      )}
    </Body>
  )
}

Component.styles = {
  element: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(20em, 1fr))',
    alignItems: 'start',
    gap: 6,
    padding: 6,
  },
  story: {
    padded: {
      display: 'flex',
      flexDirection: 'column',
      margin: 12,
      backgroundColor: 'grayLighter',
      borderRadius: '0.25em',
      overflow: 'hidden',
    },
    fullscreen: {
      gridColumn: '1 / -1',
      display: 'flex',
      flexDirection: 'column',
      margin: 12,
      backgroundColor: 'grayLighter',
    },
  },
  // a `padded` canvas holds a fixed height, a virtualized story never measures one it defines itself
  canvas: {
    padded: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '24em',
      overflow: 'auto',
      padding: 6,
      backgroundColor: 'grayLightest',
    },
    fullscreen: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      backgroundColor: 'grayLightest',
    },
  },
  caption: {
    padding: 8,
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'textLightest',
    textAlign: 'center',
  },
}

export default Component
