import React from 'react'
import { styles } from '../index.js'
import filesize from 'shared/utils/filesize'

const Logs = ({ values, handleChange, ...props }) => (
  <div style={styles.section}>
    <h1 style={styles.title}>Logs</h1>
    <p style={styles.paragraph}>
      Some Sensorr jobs (recording) create log files that can reach a considerable size, to avoid filling your disk space, you can specify here the maximum space (in <code style={styles.code}>MB</code>) allowed.
      <br/>
      A <code style={styles.code}>clean</code> job will remove oldest log sessions if directory space exceeds configured value.
    </p>
    <div style={styles.column}>
      <input
        type="number"
        placeholder={'Space (in MB)'}
        style={styles.input}
        defaultValue={parseInt(filesize.stringify(values.logs.limit, false)) || null}
        required={true}
        onChange={e => handleChange('logs', { ...values.logs, limit: parseInt(e.target.value) })}
      />
    </div>
  </div>
)

export default Logs
