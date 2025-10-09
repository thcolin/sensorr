import { useOutletContext } from 'react-router-dom'

const Update = ({ ...props }) => {
  const { updateAvailable, remoteApp } = useOutletContext() as any

  return (
    <section>
      <article>
        <h2>Update</h2>
        {updateAvailable && (
          <div sx={Update.styles.info}>
            <strong>Info</strong>, a new version is available <strong sx={{ variant: 'code.reset' }}>v{remoteApp?.version}</strong>
          </div>
        )}
        <p>
          To update Sensorr you need to update Sensorr Docker images. You can either use a tool to automatically update images, like <a href='https://github.com/containrrr/watchtower' target='_blank' rel='noopener noreferrer'>watchtower</a> or manually take down the stack, pull updated images and start the stack back
        </p>
        <br/>
        <code sx={{ display: 'block', padding: '1em 1.5em !important', overflowY: 'auto', overflowX: 'hidden' }}>
          cd ~/.sensorr # Or wherever you put your Sensorr `docker-compose.yml` file<br/>
          docker compose down --remove-orphans<br/>
          docker compose pull sensorr/sensorr-web<br/>
          docker compose pull sensorr/sensorr-api<br/>
          docker compose up -d<br/>
        </code>
      </article>
    </section>
  )
}

Update.styles = {
  info: {
    backgroundColor: '#a4e1ff',
    paddingX: 4,
    paddingY: 8,
    color: '#064666',
    border: '1px solid #064666',
    borderRadius: '0.25em',
    fontSize: 5,
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
  },
}

export default Update
