import { QRCodeSVG } from 'qrcode.react'

const ProgressiveWebApp = ({ ...props }) => (
  <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
)

export default ProgressiveWebApp
