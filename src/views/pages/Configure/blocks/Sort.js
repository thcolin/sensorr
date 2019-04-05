import React from 'react'
import { styles } from '../index.js'

const placeholder = {
  sort: 'seeders',
}

const Sort = ({ values, handleChange, ...props }) => (
  <div style={styles.section}>
    <h1 style={styles.title}>Sort</h1>
    <p style={{ ...styles.paragraph, flex: 1, }}>
      Same as filter, used by CLI with <code style={styles.code}>-a</code> or <code style={styles.code}>--auto</code> option to sort results, define sort property among :
      &nbsp;
      <code style={styles.code}>seeders</code>, <code style={styles.code}>peers</code> and <code style={styles.code}>size</code>
      <br/>
      <br/>
    </p>
    <p style={styles.paragraph}>
      Here you need to specify <strong>sort property</strong> :
    </p>
    <div style={styles.column}>
      <input
        type="text"
        placeholder={placeholder.sort}
        style={styles.input}
        defaultValue={values.sort}
        onChange={e => handleChange('sort', e.target.value)}
      />
      <label htmlFor="descending" style={{ ...styles.input, borderColor: 'transparent' }}>
        <input
          id="descending"
          type="checkbox"
          defaultChecked={values.descending}
          onChange={e => handleChange('descending', e.target.checked)}
          style={{ marginRight: '1em', }}
        />
        Descending
      </label>
    </div>
  </div>
)

export default Sort
