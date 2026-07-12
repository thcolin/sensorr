import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useOutlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useThemeUI } from 'theme-ui'
import semver from 'semver'
import { useAPI } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useDeviceContext } from '../../contexts/Device/Device'
import localApp from '../../../../../package.json'

const Settings = ({ ...props }) => {
  const api = useAPI()
  const { config } = useConfigContext()
  const { theme } = useThemeUI()
  const { device } = useDeviceContext()
  const location = useLocation()
  const [remoteApp, setRemoteApp] = useState(null)
  const [updateAvailable, setUpdateAvailable] = useState(null)

  const onSave = useCallback((data) => {
    // console.log('onSave', data)
    toast.promise(new Promise(async (resolve, reject) => {
      const { uri, params, init } = api.query.config.postConfig({ body: data })

      try {
        const raw = await api.fetch(uri, params, init)
        config.load(raw)
        resolve(true)
      } catch (err) {
        console.warn(err)
        reject(err)
      }
    }), {
      loading: `Updating **config**...`,
      success: () => `Config **updated** !`,
      error: () => `Error while updating **config**`,
    })
  }, [])

  useEffect(() => {
    const callback = async () => {
      try {
        const res = await fetch('https://raw.githubusercontent.com/thcolin/sensorr/master/package.json')
        const data = await res.json()
        setRemoteApp(data)
        const updateAvailable = semver.gt(data.version, localApp.version)
        setUpdateAvailable(updateAvailable)

        if (updateAvailable) {
          toast(`New version available **v${data.version}**`)
        }
      } catch (err) {
        console.warn(err)
      }
    }

    callback()
  }, [])

  return (
    <section sx={Settings.styles.element}>
      <aside sx={Settings.styles.sidebar} style={device === 'mobile' ? { display: (location.pathname === '/settings') ? 'flex' : 'none' } : {}}>
        <h1>Settings</h1>
        <nav>
          <NavLink to='tmdb' viewTransition={device === 'mobile'}>TMDB</NavLink>
          <NavLink to='blackhole' viewTransition={device === 'mobile'}>Blackhole</NavLink>
          <NavLink to='indexers' viewTransition={device === 'mobile'}>Indexers</NavLink>
          <NavLink to='policies' viewTransition={device === 'mobile'}>Policies</NavLink>
          <NavLink to='jobs' viewTransition={device === 'mobile'}>Jobs</NavLink>
          <NavLink to='friends' viewTransition={device === 'mobile'}>Friends</NavLink>
          <NavLink to='plex' viewTransition={device === 'mobile'}>Plex</NavLink>
          <NavLink to='mobile' viewTransition={device === 'mobile'}>Mobile</NavLink>
          <NavLink to='update' viewTransition={device === 'mobile'}>Update</NavLink>
        </nav>
        <footer>
          <span>🍿📼</span>
          <h2>sensorr</h2>
          <small>Your Friendly Digital Video Recorder</small>
          <div>
            <a href='https://github.com/thcolin/sensorr' target='_blank' rel='noopener noreferrer'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1024 1024">
                <path fill={theme.colors.black as any} fillRule="evenodd" d="M512 0C229.12 0 0 229.12 0 512c0 226.56 146.56 417.92 350.08 485.76 25.6 4.48 35.2-10.88 35.2-24.32 0-12.16-.64-52.48-.64-95.36-128.64 23.68-161.92-31.36-172.16-60.16-5.76-14.72-30.72-60.16-52.48-72.32-17.92-9.6-43.52-33.28-.64-33.92 40.32-.64 69.12 37.12 78.72 52.48 46.08 77.44 119.68 55.68 149.12 42.24 4.48-33.28 17.92-55.68 32.64-68.48-113.92-12.8-232.96-56.96-232.96-252.8 0-55.68 19.84-101.76 52.48-137.6-5.12-12.8-23.04-65.28 5.12-135.68 0 0 42.88-13.44 140.8 52.48 40.96-11.52 84.48-17.28 128-17.28 43.52 0 87.04 5.76 128 17.28 97.92-66.56 140.8-52.48 140.8-52.48 28.16 70.4 10.24 122.88 5.12 135.68 32.64 35.84 52.48 81.28 52.48 137.6 0 196.48-119.68 240-233.6 252.8 18.56 16 34.56 46.72 34.56 94.72 0 68.48-.64 123.52-.64 140.8 0 13.44 9.6 29.44 35.2 24.32C877.44 929.92 1024 737.92 1024 512 1024 229.12 794.88 0 512 0Z" clipRule="evenodd" />
              </svg>
            </a>
            <code {...(updateAvailable ? { 'data-update-available': true, title: 'Update available' } : {})}>v{localApp.version}</code>
          </div>
        </footer>
      </aside>
      <div sx={Settings.styles.container} style={device === 'mobile' ? { display: (location.pathname === '/settings') ? 'none' : 'block' } : {}}>
        <Outlet context={{ onSave, updateAvailable, remoteApp }} />
      </div>
    </section>
  )
}

Settings.styles = {
  element: {
    display: 'flex',
    flex: '1 1 0%',
    overflow: ['unset', 'hidden'],
  },
  sidebar: {
    display: 'flex',
    flexDirection: ['column-reverse', 'column'],
    minWidth: ['100%', '21em'],
    maxWidth: ['100%', '21em'],
    paddingBottom: [0, 12],
    backgroundColor: 'grayLighter',
    '>h1': {
      display: ['none', 'block'],
      paddingX: 4,
      paddingY: 4,
      margin: 12,
    },
    '>nav': {
      flex: ['none', 1],
      display: 'flex',
      flexDirection: 'column',
      overflowY: ['unset', 'auto'],
      overflowX: ['unset', 'hidden'],
      backgroundColor: ['grayLight', 'unset'],
      marginX: [2, 12],
      // borderRadius: '0.25em',
      'a': {
        fontFamily: 'heading',
        color: 'text',
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
  container: {
    display: 'flex',
    flex: 1,
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
