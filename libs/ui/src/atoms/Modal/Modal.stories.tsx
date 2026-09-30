import { useState } from 'react'
import { Button } from '../Button/Button'
import { Modal as UIModal } from './Modal'

export default { component: UIModal, title: 'Atoms / Modal' }

export const Modal = (args: any) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button color='primary' onClick={() => setOpen(true)}>Open</Button>
      <UIModal {...args} open={open} close={() => setOpen(false)}>
        <p sx={{ padding: 4, margin: 12, lineHeight: 'body' }}>Escape, a click outside or the cross close it, and the focus goes back to the button that opened it.</p>
      </UIModal>
    </>
  )
}

Modal.args = {
  title: 'Start a job',
}
