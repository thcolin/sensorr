import React from 'react'
import { styles } from '../index.js'

const Authentication = ({ values, handleChange, ...props }) => (
  <div style={styles.section}>
    <h1 style={styles.title}>Authentication</h1>
    <p style={styles.paragraph}>
      To securize your Sensorr instance you can fill a username and a password. Leave blank for no authentication.
      <br/>
      <br/>
      Specify <code style={styles.code}>username</code> and <code style={styles.code}>password</code> :
    </p>
    <div style={styles.column}>
      <input
        type="text"
        placeholder={'Username'}
        style={{ ...styles.input, marginRight: '1em', }}
        defaultValue={values.auth.username}
        required={true}
        onChange={e => handleChange('auth', { ...values.auth, username: e.target.value })}
      />
      <input
        type="text"
        placeholder={'Password'}
        style={{ ...styles.input, marginLeft: '1em', }}
        defaultValue={values.auth.password}
        required={true}
        onChange={e => handleChange('auth', { ...values.auth, password: e.target.value })}
      />
    </div>
  </div>
)

export default Authentication
