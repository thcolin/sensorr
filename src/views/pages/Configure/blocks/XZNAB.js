import React from 'react'
import { styles } from '../index.js'

const placeholder = {
  xznab: {
    name: 'Name',
    url: 'http://localhost:5060/torznab/aggregate/api',
    key: 'API Key',
  },
}

const XZNAB = ({ values, handleChange, ...props }) => (
  <div style={styles.section}>
    <h1 style={styles.title}>XZNAB</h1>
    <p style={styles.paragraph}>
      Sensorr works with <strong>XZNAB</strong> (<a href="https://github.com/Sonarr/Sonarr/wiki/Implementing-a-Torznab-indexer" style={styles.link}>Torznab</a> or <a href="http://www.newznab.com/" style={styles.link}>Newznab</a>) API servers, add as many as you wish, they will be used to perform looks query.
      <br/>
      <br/>
    </p>
    <p style={styles.paragraph}>Example:</p>
    <ul style={styles.list}>
      <li>Jackett: <code style={styles.code}>http://localhost:9117/api/v2.0/indexers/xxx/results/torznab/</code></li>
      <li>Cardigann: <code style={styles.code}>http://localhost:5060/torznab/xxx/api</code> (don't forget <code style={styles.code}>/api</code> after copied Cardigann Torznab link !)</li>
    </ul>
    {(values.xznabs.length ? values.xznabs : [{ name: '', url: '', key: '' }]).map((xznab, index, self) => (
      <div style={{ ...styles.column, alignItems: 'center' }} key={index}>
        <input
          type="checkbox"
          title={xznab.disabled ? 'Disabled' : 'Enabled'}
          style={styles.checkbox}
          checked={!xznab.disabled}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, disabled: !e.target.checked } : foo))}
        />
        <input
          type="text"
          placeholder={placeholder.xznab.name}
          style={{ ...styles.input, marginLeft: '1em', marginRight: '1em', }}
          value={xznab.name}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, name: e.target.value } : foo))}
        />
        <input
          type="text"
          placeholder={placeholder.xznab.url}
          style={{ ...styles.input, marginLeft: '1em', marginRight: '1em', }}
          value={xznab.url}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, url: e.target.value } : foo))}
        />
        <input
          type="text"
          placeholder={placeholder.xznab.key}
          style={{ ...styles.input, marginLeft: '1em', }}
          value={xznab.key}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, key: e.target.value } : foo))}
        />
        <div style={styles.remove} onClick={() => handleChange('xznabs', self.filter((foo, i) => i !== index))}>🗑️</div>
      </div>
    ))}
    <div style={styles.add} onClick={() => handleChange('xznabs', [...values.xznabs, { name: '', url: '', key: '' }])}>🌱</div>
  </div>
)

export default XZNAB
