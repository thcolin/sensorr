import React, { PureComponent, useState } from 'react'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import reorder from 'array-move'
import { styles } from '../index.js'
import rules from 'oleoo/src/rules.json'

const SortableItem = SortableElement(({ value, index, disabled, onRemoveClick, ...props }) => (
  <li key={index} style={{ listStyle: 'inherit', cursor: disabled ? 'default' : 'pointer' }}>
    <span
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5em 0',
        MozUserSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <span>{value}</span>
      <span style={{ cursor: 'pointer' }} onClick={onRemoveClick}>🗑️</span>
    </span>
  </li>
))

const Behavior = ({ values, behavior, handleChange }) => {
  const [tag, setTag] = useState('source')
  const [keyword, setKeyword] = useState(Object.keys(rules[tag]).filter(k => !(values.policy[behavior][tag] || []).includes(k)).shift() || '')

  return (
    <div style={{ prefered: { margin: '0 1em 0 0' }, restricted: { margin: '0 0 0 1em' } }[behavior]}>
      <h2 style={{ ...styles.subtitle, textTransform: 'capitalize' }}>{behavior}</h2>
      <p style={styles.paragraph}>
        {{
          prefered: 'Here you can specify and order prefered keywords, top ones will get a better "score" when choosing appropriate release',
          restricted: 'Here you can specify custom restricted keywords, if any is found in a release title, this one will be filtered',
        }[behavior]}
      </p>
      <div style={{ ...styles.column, alignItems: 'center' }}>
        <select style={styles.select} value={tag} onChange={e => {
          setTag(e.target.value)
          setKeyword(Object.keys(rules[e.target.value]).filter(k => !(values.policy[behavior][e.target.value] || []).includes(k)).shift() || '')
        }}>
          {Object.keys(rules).map(t => (
            <option key={t} value={t}>{`${t.charAt(0).toUpperCase()}${t.slice(1)}`}</option>
          ))}
        </select>
        <select style={{ ...styles.select, margin: '1em' }} value={keyword} onChange={e => setKeyword(e.target.value)}>
          <option key="null" value={''} disabled={true}>-</option>
          {Object.keys(rules[tag]).map(k => (
            <option key={k} value={k} disabled={(values.policy[behavior][tag] || []).includes(k)}>{`${k.charAt(0).toUpperCase()}${k.slice(1)}`}</option>
          ))}
        </select>
        <button
          type="button"
          style={{ background: 'none', border: 'none', fontSize: '1.25em', cursor: keyword ? 'pointer' : 'default' }}
          disabled={!keyword}
          onClick={() => {
            setKeyword(Object.keys(rules[tag]).filter(k => !(values.policy[behavior][tag] || []).includes(k) && k !== keyword).shift() || '')
            handleChange('policy', ({
              ...values.policy,
              [behavior]: {
                ...values.policy[behavior],
                [tag]: [
                  ...(values.policy[behavior][tag] || []),
                  keyword,
                ],
              }
            }))
          }}
        >
          {{
            prefered: '👍',
            restricted: '👎',
          }[behavior]}
        </button>
      </div>
      <br/>
      {Object.keys(values.policy[behavior]).filter(key => values.policy[behavior][key].length).map(tag => {
        const SortableKeywords = SortableContainer(({ items }) => (
          <ul
            style={{
              prefered: {
                listStyle: 'decimal',
                padding: '0 0 0 2em',
              },
              restricted: {},
            }[behavior]}
          >
            {items.map((value, index) => (
              <SortableItem
                key={index}
                index={index}
                value={value}
                disabled={behavior === 'restricted'}
                onRemoveClick={() => handleChange('policy', ({
                  ...values.policy,
                  [behavior]: {
                    ...values.policy[behavior],
                    [tag]: values.policy[behavior][tag].filter(v => value !== v),
                  }
                }))}
              />
            ))}
          </ul>
        ))

        return (
          <>
            <h3
              key="title"
              style={{
                textTransform: 'capitalize',
                padding: '0.5em 0',
                fontSize: '1.125em',
              }}
            >
              <strong>{tag}</strong>
            </h3>
            <div key="list">
              <SortableKeywords
                items={values.policy[behavior][tag]}
                lockAxis="y"
                distance={10}
                lockToContainerEdges={true}
                onSortEnd={({ oldIndex, newIndex }) => handleChange('policy', ({
                  ...values.policy,
                  [behavior]: {
                    ...values.policy[behavior],
                    [tag]: reorder(values.policy[behavior][tag], oldIndex, newIndex),
                  }
                }))}
              />
            </div>
          </>
        )
      })}
    </div>
  )
}

class Policy extends PureComponent {
  render () {
    const { values, handleChange, ...props } = this.props

    return (
      <div style={styles.section}>
        <h1 style={styles.title}>Policy</h1>
        <p style={{ ...styles.paragraph, flex: 1, }}>
          When using CLI with <code style={styles.code}>-a</code> or <code style={styles.code}>--auto</code> option, results will be filtered and ordered with defined <code style={styles.code}>policy</code>
          <br/>
          <br/>
        </p>
        <div>
          <h2 style={styles.subtitle}>Sort</h2>
          <p style={{ ...styles.paragraph, flex: 1, }}>
            Choose default <code style={styles.code}>sort</code> option :
            <br/>
          </p>
          <div style={styles.column}>
            <select style={{ ...styles.select, margin: '1em 1em 1em 0' }} value={values.sort} onChange={e => handleChange('sort', e.target.value)}>
              {['seeders', 'peers', 'size'].map(sort => (
                <option key={sort} value={sort}>{`${sort.charAt(0).toUpperCase()}${sort.slice(1)}`}</option>
              ))}
            </select>
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
        <br/>
        <div style={styles.column}>
          <Behavior behavior="prefered" values={values} handleChange={handleChange} />
          <Behavior behavior="restricted" values={values} handleChange={handleChange} />
        </div>
      </div>
    )
  }
}

export default Policy
