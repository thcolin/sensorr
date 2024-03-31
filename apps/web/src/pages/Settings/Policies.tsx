import React, { useCallback } from 'react'
import { Button } from '@sensorr/ui'
import { useFieldArray, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'

const Policies = ({ ...props }) => {
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })
  const znabs = useFieldArray({
    control: form.control,
    name: 'znabs',
    rules: {
      required: true,
      validate: (values) => {
        console.log(values)
        return 'lol'
      }
    },
  })

  console.log(znabs)
  console.log(form.formState.errors)

  const onSubmit = useCallback((data) => {
    console.log(data)
  }, [])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} sx={Policies.styles.element}>
      <section>
        <h2>Policies</h2>
        <p>
          {/* Sensorr will download releases <code>.torrent</code> or <code>.nzb</code> files to your defined blackhole directory, then configure your torrent/nzb client to watch this directory and download the releases ! */}
        </p>
        <div sx={{ display: 'flex', flexDirection: 'column' }}>
        </div>
        <div sx={{ display: 'flex', marginTop: 4 }}>
          <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
        </div>
      </section>
    </form>
  )
}

Policies.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center',
    paddingX: 2,
    paddingBottom: 0,
    code: {
      variant: 'code.tag',
    },
    p: {
      marginY: 8,
      lineHeight: 'body',
    },
    h3: {
      marginY: 8,
    },
    a: {
      color: 'primary',
      ':hover': {
        color: 'accent',
      },
    },
    section: {
      width: '100%',
      paddingX: 4,
      maxWidth: '96rem',
      '>div': {
        paddingY: 8,
      }
    },
  },
}

export default Policies
