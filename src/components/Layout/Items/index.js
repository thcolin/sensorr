import React, { useMemo, useCallback } from 'react'
import * as Emotion from '@emotion/core'
import List from 'components/Layout/List'
import VirtualGrid from 'components/Layout/VirtualGrid'
import Empty from 'components/Empty'
import theme from 'theme'

const Items = ({
  entities = [],
  findEntity = (index, entities) => entities[index],
  total: _total = null,
  placeholders: _placeholders = null,
  child = null,
  display = 'row',
  props: _props = {},
  limit = Infinity,
  ready = true,
  loading = false,
  hide = false,
  stack = false,
  label = null,
  subtitle = null,
  error = null,
  options = {},
  empty = {},
  more = null,
  onMore = () => {},
  ...title
}) => {
  const props = useMemo(() => typeof _props === 'function' ? _props : () => _props, [_props])
  const total = useMemo(() => {
    const length = ((!ready || loading) ?
      ((typeof _placeholders === 'number' ? _placeholders : entities.length) || 20) :
      (typeof _total === 'number' ? _total : entities.length)
    )

    return Math.min(length + (more && (length >= 20) ? 1 : 0), limit)
  }, [more, limit, ready, loading, _total, _placeholders, entities.length])

  const renderChild = useCallback((index) => {
    const isMore = more && total >= 20 && index === (total - 1)
    const placeholder = child.placeholder(props({ index }))
    const raw = findEntity(index, entities)
    const entity = (ready && !loading && !isMore && raw?.id) ? raw : placeholder
    return Emotion.jsx(child, isMore ? {
      ...props({ index }),
      entity: child.more(props({ index })),
      link: () => more,
      withHover: false,
      withState: false,
      withMore: true,
    } : {
      ...props({ entity, index }),
      entity,
    })
  }, [more, total, findEntity, entities, child, ready, loading])

  const override = useMemo(() => (!total || !!error) ? (
    <Empty
      {...empty}
      title={error ? 'Oh ! You came across a bug...' : empty.title}
      emoji={error ? '🐛' : empty.emoji}
      subtitle={error ? error.message : empty.subtitle}
    />
  ) : null, [total, error, empty])

  return (!!total || loading || !hide) && (
    <div css={Items.styles.element}>
      {!!label && (
        <h1 {...title} css={[Items.styles.label, title.css]}>
          {label}
        </h1>
      )}
      {display === 'virtual-grid' ? (
        <VirtualGrid
          total={total}
          renderChild={renderChild}
          override={override}
          onMore={onMore}
        />
      ) : (
        <List
          entities={entities}
          total={total}
          renderChild={renderChild}
          override={override}
          options={{
            ...options,
            display,
            stack,
          }}
        />
      )}
      {subtitle}
    </div>
  )
}

Items.styles = {
  element: {
    position: 'relative',
    padding: '2em 0',
  },
  label: {
    padding: '0 1.5em',
    margin: 0,
    fontSize: '1em',
    fontWeight: '800',
    lineHeight: '1.25',
    color: theme.colors.rangoon,
  },
}

export default Items
