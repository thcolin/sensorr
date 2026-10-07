import { QRCodeSVG } from 'qrcode.react'
import { Trans, useTranslation } from 'react-i18next'
import { useTitle } from '@sensorr/utils'

const Mobile = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.mobile') }))

  return (
  <div sx={{ display: 'flex', alignItems: 'stretch', minHeight: '100%', width: '100%' }}>
    <div sx={{ flex: 1, overflow: 'auto', paddingX: ['1.5em', '2.5em'], paddingBottom: 0 }}>
      <h2>{t('settings.mobile.title')}</h2>
      <p>{t('settings.mobile.intro')}</p>
      <h3 sx={{ margin: 12, marginTop: 4 }}>{t('settings.mobile.ios.title')}</h3>
      <ol sx={{ paddingLeft: 4, margin: 4, fontSize: 5, 'li': { marginBottom: 8 } }}>
        <li><Trans t={t} i18nKey='settings.mobile.ios.open' components={[<strong />]} /></li>
        <li><Trans t={t} i18nKey='settings.mobile.ios.share' components={[<strong />]} /></li>
        <li><Trans t={t} i18nKey='settings.mobile.ios.add' components={[<strong />]} /></li>
        <li><Trans t={t} i18nKey='settings.mobile.ios.confirm' components={[<strong />]} /></li>
      </ol>
      <h3 sx={{ margin: 12, marginTop: 4 }}>{t('settings.mobile.android.title')}</h3>
      <ol sx={{ paddingLeft: 4, margin: 4, fontSize: 5, 'li': { marginBottom: 8 } }}>
        <li><Trans t={t} i18nKey='settings.mobile.android.open' components={[<strong />]} /></li>
        <li><Trans t={t} i18nKey='settings.mobile.android.banner' components={[<strong />]} /></li>
        <li><Trans t={t} i18nKey='settings.mobile.android.menu' components={[<strong />]} /></li>
        <li><Trans t={t} i18nKey='settings.mobile.android.install' components={[<strong />]} /></li>
      </ol>
      <h3 sx={{ margin: 12, marginTop: 4 }}>{t('settings.mobile.desktop.title')}</h3>
      <ol sx={{ paddingLeft: 4, margin: 4, fontSize: 5, 'li': { marginBottom: 8 } }}>
        <li><Trans t={t} i18nKey='settings.mobile.desktop.icon' components={[<strong />]} /></li>
        <li><Trans t={t} i18nKey='settings.mobile.desktop.install' components={[<strong />]} /></li>
        <li>{t('settings.mobile.desktop.done')}</li>
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
        {t('settings.mobile.pitch.title')}
      </h2>
      <p sx={{ margin: 12, maxWidth: '35em', paddingX: 0, textAlign: 'center' }}>
        {t('settings.mobile.pitch.subtitle')}
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
}

export default Mobile
