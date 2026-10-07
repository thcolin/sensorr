import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useOutlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Icon } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { useAPI, errorOf } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useDeviceContext } from '../../contexts/Device/Device'
import { availableOf } from './channels'

declare const SENSORR_VERSION: string

// Returns the toast's promise, so a caller can wait for the config to be written
export const useSaveConfig = () => {
  const api = useAPI()
  const { load } = useConfigContext()

  return useCallback((data) => toast.promise((async () => {
    const { uri, params, init } = api.query.config.postConfig({ body: data })

    try {
      const raw = await api.fetch(uri, params, init)
      await load(raw)
      return true
    } catch (err) {
      console.warn(err)
      throw err
    }
  })(), {
    loading: i18n.t('settings.save.loading'),
    success: () => i18n.t('settings.save.success'),
    error: () => i18n.t('settings.save.error'),
  }), [])
}

const GROUPS = [
  { key: 'app', links: ['home', 'lists', 'friends', 'schedule'] },
  { key: 'download', links: ['indexers', 'policies', 'blackhole'] },
  { key: 'services', links: ['tmdb', 'plex', 'tautulli'] },
  { key: 'system', links: ['mail', 'update', 'backup', 'mobile'] },
]

const Settings = ({ ...props }) => {
  const { t } = useTranslation()
  const api = useAPI()
  const { device } = useDeviceContext()
  const location = useLocation()
  const nav = useRef(null)
  const [update, setUpdate] = useState(null)

  const onSave = useSaveConfig()

  const loadUpdate = useCallback(async () => {
    try {
      const { uri, params, init } = api.query.update.getUpdate()
      const raw = await api.fetch(uri, params, init, { rawError: true })
      setUpdate(raw)
      return raw
    } catch (err) {
      console.warn(err)
      setUpdate({ error: (await errorOf(err)) || (err.status ? i18n.t('settings.update.apiAnswered', { status: err.status }) : err.message) })
    }
  }, [])

  useEffect(() => {
    loadUpdate().then((raw) => {
      if (availableOf(raw) && !location.pathname.startsWith('/settings/update')) {
        toast(t('settings.update.toast', { version: availableOf(raw) }), { id: 'update-available' })
      }
    })
  }, [])

  // The sidebar scrolls on a short window: the page open stays in sight, the last ones included
  useEffect(() => {
    nav.current?.querySelector('a.active')?.scrollIntoView({ block: 'nearest' })
  }, [location.pathname])

  return (
    <section sx={Settings.styles.element}>
      <aside sx={Settings.styles.sidebar} style={device === 'mobile' ? { display: (location.pathname === '/settings') ? 'flex' : 'none' } : {}}>
        <h1>{t('settings.title')}</h1>
        <nav ref={nav} aria-label={t('settings.title')}>
          {GROUPS.map(({ key, links }) => {
            const id = `settings-${key}`
            return (
              <div key={key} role='group' aria-labelledby={id}>
                <span id={id}>{t(`settings.groups.${key}`)}</span>
                {links.map((to) => (
                  <NavLink key={to} to={to} viewTransition={device === 'mobile'}>{t(`settings.sections.${to}`)}</NavLink>
                ))}
              </div>
            )
          })}
        </nav>
        <footer>
          <span>🍿📼</span>
          <h2>{t('settings.footer.name')}</h2>
          <small>{t('settings.footer.tagline')}</small>
          <div>
            <a href='https://github.com/thcolin/sensorr' target='_blank' rel='noopener noreferrer'>
              <Icon value='github' sx={{ color: 'black' }} />
            </a>
            <code data-update-available={availableOf(update) ? true : undefined} title={availableOf(update) ? t('settings.update.available') : undefined}>{`v${SENSORR_VERSION}`}</code>
          </div>
        </footer>
      </aside>
      <div sx={Settings.styles.container} style={(device === 'mobile' && location.pathname === '/settings') ? { display: 'none' } : {}}>
        <Outlet context={{ onSave, update, loadUpdate }} />
      </div>
    </section>
  )
}

Settings.styles = {
  element: {
    display: 'flex',
    flex: '1 1 0%',
    overflow: 'hidden',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: ['100%', '21em'],
    maxWidth: ['100%', '21em'],
    paddingBottom: [0, 12],
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: 'grayLighter',
    '>h1': {
      display: ['none', 'block'],
      paddingX: 4,
      paddingY: 4,
      margin: 12,
    },
    '>nav': {
      flex: ['none', '1 0 auto'],
      display: 'flex',
      flexDirection: 'column',
      marginX: [2, 12],
      '>div': {
        display: 'flex',
        flexDirection: 'column',
      },
      // In its own 10px: 8px left of the links
      '>div>span': {
        display: 'block',
        margin: 12,
        paddingX: ['0.8em', '3.2em'],
        paddingTop: ['2.4em', '2em'],
        paddingBottom: ['0.8em', '0.5em'],
        fontFamily: 'heading',
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'grayDarkest',
      },
      '>div:first-of-type>span': {
        paddingTop: ['2.4em', 12],
      },
      // Scrolled into view, the first link of a group keeps its title in sight
      'span + a': {
        scrollMarginTop: '2em',
      },
      'a': {
        fontFamily: 'heading',
        color: 'text',
        backgroundColor: ['grayLight', 'transparent'],
        paddingX: [4, 0],
        paddingY: [4, 9],
        fontSize: [4, 3],
        fontWeight: ['semibold', 'normal'],
        textDecoration: 'none',
        '&:not(:last-of-type)': {
          borderBottom: ['1px solid', 'none'],
          borderColor: 'gray',
        },
        '&:hover': {
          backgroundColor: 'grayLight',
        },
        '&.active': {
          backgroundColor: 'primary',
          color: 'whitePure',
        },
      },
    },
    '>footer': {
      order: [-1, 0],
      paddingX: 4,
      paddingY: [0, 4],
      textAlign: 'center',
      '>span': {
        fontSize: 1,
      },
      '>h2': {
        margin: 12,
        color: 'text',
        fontFamily: 'heading',
        fontSize: 2,
        fontWeight: 'heading',
        lineHeight: 'heading',
      },
      '>small': {
        display: 'block',
        color: 'grayDark',
        paddingY: 8,
      },
      '>div': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingY: 8,
        fontSize: 5,
        '>a': {
          marginRight: 6,
          '>svg': {
            height: '1.5em',
            width: '1.5em',
          },
        },
        '>code': {
          position: 'relative',
          '&[data-update-available]::after': {
            content: '""',
            position: 'absolute',
            top: '-0.25em',
            right: '-0.75em',
            display: 'block',
            height: '0.5em',
            width: '0.5em',
            borderRadius: '50%',
            backgroundColor: 'error',
          },
        },
      },
    },
  },
  // Without it, a line that does not wrap (an indexer's error) widens the page past the screen.
  container: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    'section': {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      alignItems: 'center',
      paddingX: [8, 2],
      paddingBottom: 0,
      'code': {
        variant: 'code.tag',
      },
      'p': {
        marginY: 8,
        lineHeight: 'body',
      },
      'h3': {
        marginY: 8,
      },
      'a': {
        color: 'primary',
        ':hover': {
          color: 'accent',
        },
      },
      'article': {
        width: '100%',
        paddingX: 4,
        maxWidth: '96rem',
      },
      'ul': {
        paddingLeft: 2,
        '>li': {
          lineHeight: 'space',
        },
      },
    },
  },
}

export default Settings
