import React from 'react'
import { styles } from '../index.js'

const placeholder = {
  blackhole: '/tmp',
}

const XZNAB = ({ values, handleChange, ...props }) => (
  <div style={styles.section}>
    <h1 style={styles.title}>Blackhole</h1>
    <p style={{ ...styles.paragraph, flex: 1, }}>
      Sensorr works with <strong>XZNAB</strong> API servers and will download any <code style={styles.code}>.torrent</code> or <code style={styles.code}>.nzb</code> file into defined Server <code style={styles.code}>blackhole</code> path.
      <br/>
      If you run Sensorr from <a href="https://hub.docker.com/r/thcolin/sensorr/" style={styles.link}>Docker</a> image, keep it to <code style={styles.code}>/app/sensorr/blackhole</code>.
      <br/>
      <br/>
    </p>
    <p style={styles.paragraph}>
      Here you need to fill <strong>server</strong> blackhole <strong>path</strong> :
    </p>
    <input
      type="text"
      placeholder={placeholder.blackhole}
      style={styles.input}
      defaultValue={values.blackhole}
      onChange={e => handleChange('blackhole', e.target.value)}
    />
  </div>
)

export default XZNAB
