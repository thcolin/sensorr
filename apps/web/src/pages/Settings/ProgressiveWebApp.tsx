import QRCode from 'qrcode.react'

const ProgressiveWebApp = ({ ...props }) => (
  <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <QRCode
      value={window?.location?.origin}
      fgColor="#121212"
      size={256}
      level='M'
      includeMargin={true}
      imageSettings={{
        src: require('../../assets/favicon.png').default,
        excavate: true,
      }}
    />
  </div>
)

export default ProgressiveWebApp
