import { memo, useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { LoadingBar } from '../../layout/LoadingBar'
import { useAuthContext } from '../../contexts/Auth/Auth'

const Login = () => {
  const api = useAPI()
  const { authenticate, authenticated } = useAuthContext()
  const [ongoing, setOngoing] = useState(false)
  const [error, setError] = useState(null)
  const handleLogin = useCallback(async (e) => {
    e.preventDefault()
    setError(null)
    setOngoing(true)
    const { uri, params, init } = api.query.auth({ body: { username: e.target.username.value, password: e.target.password.value } })

    try {
      const { access_token } = await api.fetch(uri, params, init, { rawError: true })
      authenticate(access_token)
    } catch (err) {
      try {
        const body = await err.json()
        setError(body.message)
      } catch (e) {
        setError('Unknown error, contact administrator')
      }
    }

    setOngoing(false)
  }, [])

  if (authenticated) {
    return (
      <Navigate replace={true} to='/' />
    )
  }

  return (
    <div sx={Login.styles.element}>
      <LoadingBar />
      <div sx={Login.styles.wrapper}>
        <div sx={Login.styles.logo}>
          <span>🍿📼</span>
          <h2>sensorr</h2>
          <small>Your Friendly Digital Video Recorder</small>
        </div>
        {!!error && (
          <div sx={Login.styles.error}>{error}</div>
        )}
        <form sx={Login.styles.form} onSubmit={handleLogin}>
          <input type='text' name='username' sx={{ variant: 'input.default' }} placeholder='Username' required={true} />
          <input type='password' name='password' sx={{ variant: 'input.default' }} placeholder='Password' required={true} />
          <Button type='submit' variant='contain' color='primary' disabled={ongoing}>{ongoing ? 'Login...' : 'Login'}</Button>
        </form>
      </div>
    </div>
  )
}

Login.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'grayLightest',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '>span': {
      fontSize: '4rem',
    },
    '>h2': {
      margin: '0.5rem 0',
      color: 'text',
      fontFamily: 'heading',
      fontSize: '3rem',
      fontWeight: 'bold',
      lineHeight: 'heading',
    },
    '>small': {
      color: 'grayDark',
    },
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 0,
    marginBottom: '-1em',
    backgroundColor: 'error',
    fontFamily: 'body',
    paddingY: 6,
    paddingX: 4,
    border: '0.125em solid',
    borderColor: 'error',
    borderRadius: '0.25em',
    fontSize: 5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '14rem',
    marginY: 0,
    '>input': {
      width: '100%',
      marginY: 8,
    },
    '>button': {
      width: '100%',
      marginY: '4',
    }
  },
}

export default memo(Login)
