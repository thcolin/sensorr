import { QRCodeSVG } from 'qrcode.react'

const Mobile = ({ ...props }) => (
  <div sx={{ display: 'flex', alignItems: 'stretch', minHeight: '100%', width: '100%' }}>
    <div sx={{ flex: 1, overflow: 'auto', paddingX: '2.5em', paddingBottom: 0 }}>
      <h2>Mobile Installation Instructions (PWA)</h2>
      <p>Scan the QR code to open this page on your device, then follow the specific installation steps for your OS.</p>
      <h3 sx={{ margin: 12, marginTop: 4 }}>iOS & iPadOS</h3>
      <ol sx={{ paddingLeft: 4, margin: 4, fontSize: 5, 'li': { marginBottom: 8 } }}>
        <li>Open this page in <strong>Safari</strong>.</li>
        <li>Tap the <strong>Share</strong> icon (the square with an arrow pointing up).</li>
        <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
        <li>Confirm by tapping <strong>Add</strong> in the top-right corner.</li>
      </ol>
      <h3 sx={{ margin: 12, marginTop: 4 }}>Android</h3>
      <ol sx={{ paddingLeft: 4, margin: 4, fontSize: 5, 'li': { marginBottom: 8 } }}>
        <li>Open this page in <strong>Chrome</strong>.</li>
        <li>Look for an <strong>"Add Sensorr to Home screen"</strong> banner and tap it.</li>
        <li>If the banner doesn't appear, tap the <strong>three-dot menu</strong> icon (⋮) in the top-right corner.</li>
        <li>Select <strong>Install app</strong> from the menu and confirm.</li>
      </ol>
      <h3 sx={{ margin: 12, marginTop: 4 }}>Desktop</h3>
      <ol sx={{ paddingLeft: 4, margin: 4, fontSize: 5, 'li': { marginBottom: 8 } }}>
        <li>While on this page, click the <strong>Install icon</strong> located on the right side of the address bar frome Chrome.</li>
        <li>Click the <strong>Install</strong> button when prompted.</li>
        <li>Sensorr will now be available as a standalone app on your computer.</li>
      </ol>
    </div>
    <div sx={{ position: 'relative', flex: 1, display: ['none', 'flex'], flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: 'primaryDark', overflow: 'hidden' }}>
      <div sx={{ marginTop: 0, marginBottom: 4 }}>
        <QRCodeSVG
          value={window?.location?.origin}
          fgColor="#121212"
          size={256}
          level='M'
          includeMargin={true}
          imageSettings={{
            src: require('../../assets/favicon.png').default,
            excavate: true,
            height: 48,
            width: 48,
          }}
        />
      </div>
      <h2 sx={{ margin: 8, textAlign: 'center', }}>
        Take Sensorr With You
      </h2>
      <p sx={{ margin: 12, maxWidth: '35em', paddingX: 0, textAlign: 'center' }}>
        Install the PWA for a fast, app-like experience to manage your media library from anywhere
      </p>
      <img
        src={require('../../assets/screenshot-mobile-1.png')}
        sx={{
          position: 'absolute',
          bottom: '-35%',
          left: '10%',
          height: '80%',
          borderTopLeftRadius: '1em',
          borderTopRightRadius: '1em',
          transform: 'rotate(-3deg)',
        }}
      />
      <img
        src={require('../../assets/screenshot-mobile-2.png')}
        sx={{
          position: 'absolute',
          bottom: '-33%',
          right: '10%',
          height: '80%',
          borderTopLeftRadius: '1em',
          borderTopRightRadius: '1em',
          transform: 'rotate(3deg)',
        }}
      />
    </div>
  </div>
)

export default Mobile
