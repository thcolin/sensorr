import React, { useState, useEffect } from 'react'
import database from 'store/database'

const withCount = (WrappedComponent, table) => ({ ...props }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      const db = await database.get()
      const result = await db[table].find().where('id').in(props.entities.map(r => r.id.toString())).exec()
      setCount(result.length)
    }

    fetchCount()
  }, [props.entities])

  return (
    <WrappedComponent
      count={count}
      {...props}
    />
  )
}

export default withCount
