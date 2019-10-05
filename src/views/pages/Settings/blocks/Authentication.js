import React from 'react'
import { styles } from '../index.js'

const Authentication = ({ values, handleChange, ...props }) => (
  <div css={styles.section}>
    <h1 css={styles.title}>Authentication</h1>
    <p css={styles.paragraph}>
      To securize your Sensorr instance you can fill a username and a password. Leave blank for no authentication.
      <br/>
      <br/>
      Specify <code css={styles.code}>username</code> and <code css={styles.code}>password</code> :
    </p>
    <div css={styles.column}>
      <input
        type="text"
        placeholder={'Username'}
        css={styles.input}
        style={{ marginRight: '1em', }}
        defaultValue={values.auth.username}
        required={true}
        onChange={e => handleChange('auth', { ...values.auth, username: e.target.value })}
      />
      <input
        type="text"
        placeholder={'Password'}
        css={styles.input}
        style={{ marginLeft: '1em', }}
        defaultValue={values.auth.password}
        required={true}
        onChange={e => handleChange('auth', { ...values.auth, password: e.target.value })}
      />
    </div>
  </div>
)

export default Authentication
