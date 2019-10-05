import React, { PureComponent, useState } from 'react'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import reorder from 'array-move'
import { styles } from '../index.js'
import standards from 'oleoo/src/rules.json'

const rules = {
  ...Object.keys(standards)
    .filter(rule => !['erase'].includes(rule))
    .reduce((acc, key) => ({ ...acc, [key]: standards[key] }), {}),
  custom: {},
}

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
    <div style={{ prefer: { margin: '0 1em 0 0' }, avoid: { margin: '0 0 0 1em' } }[behavior]}>
      <h2 css={styles.subtitle} style={{ textTransform: 'capitalize' }}>{behavior}</h2>
      <p css={styles.paragraph}>
        {{
          prefer: 'Here you can specify and order prefered keywords, top ones will get a better "score" when choosing appropriate release',
          avoid: 'Here you can specify avoided keywords, if any is found in a release title, this one will be filtered',
        }[behavior]}
      </p>
      <div css={styles.column} style={{ alignItems: 'center' }}>
        <select css={styles.select} value={tag} onChange={e => {
          setTag(e.target.value)
          setKeyword(Object.keys(rules[e.target.value]).filter(k => !(values.policy[behavior][e.target.value] || []).includes(k)).shift() || '')
        }}>
          {Object.keys(rules).map(t => (
            <option key={t} value={t}>{`${t.charAt(0).toUpperCase()}${t.slice(1)}`}</option>
          ))}
        </select>
        {tag === 'custom' ? (
          <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} css={styles.select} style={{ margin: '1em' }} />
        ) : (
          <select value={keyword} onChange={e => setKeyword(e.target.value)} css={styles.select} style={{ margin: '1em' }}>
            <option key="null" value={''} disabled={true}>-</option>
            {Object.keys(rules[tag]).map(k => (
              <option key={k} value={k} disabled={(values.policy[behavior][tag] || []).includes(k)}>{`${k.charAt(0).toUpperCase()}${k.slice(1)}`}</option>
            ))}
          </select>
        )}
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
            prefer: '👍',
            avoid: '👎',
          }[behavior]}
        </button>
      </div>
      <br/>
      {Object.keys(values.policy[behavior]).filter(key => values.policy[behavior][key].length).map(tag => {
        const SortableKeywords = SortableContainer(({ items }) => (
          <ul
            style={{
              prefer: tag === 'flags' ? {} : {
                listStyle: 'decimal',
                padding: '0 0 0 2em',
              },
              avoid: {},
            }[behavior]}
          >
            {items.map((value, index) => (
              <SortableItem
                key={index}
                index={index}
                value={value}
                disabled={behavior === 'avoid' || tag === 'flags'}
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

        return [
          <h3
            key="title"
            style={{
              textTransform: 'capitalize',
              padding: '0.5em 0',
              fontSize: '1.125em',
            }}
          >
            <strong>{tag}</strong>
          </h3>,
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
        ]
      })}
    </div>
  )
}

class Policy extends PureComponent {
  render () {
    const { values, handleChange, ...props } = this.props

    return (
      <div css={styles.section}>
        <h1 css={styles.title}>Policy</h1>
        <p css={styles.paragraph} style={{ flex: 1, }}>
          When using CLI with <code css={styles.code}>-a</code> or <code css={styles.code}>--auto</code> option, results will be filtered and ordered with defined <code css={styles.code}>policy</code>
          <br/>
          <br/>
        </p>
        <div>
          <h2 css={styles.subtitle}>Sort</h2>
          <p css={styles.paragraph} style={{ flex: 1, }}>
            Choose default <code css={styles.code}>sort</code> option :
            <br/>
          </p>
          <div css={styles.column}>
            <select css={styles.select} style={{ margin: '1em 1em 1em 0' }} value={values.sort} onChange={e => handleChange('sort', e.target.value)}>
              {['seeders', 'peers', 'size'].map(sort => (
                <option key={sort} value={sort}>{`${sort.charAt(0).toUpperCase()}${sort.slice(1)}`}</option>
              ))}
            </select>
            <label htmlFor="descending" css={styles.input} style={{ borderColor: 'transparent' }}>
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
          <br/>
          <br/>
        </div>
        <div css={styles.column}>
          <Behavior behavior="prefer" values={values} handleChange={handleChange} />
          <Behavior behavior="avoid" values={values} handleChange={handleChange} />
        </div>
      </div>
    )
  }
}

export default Policy
