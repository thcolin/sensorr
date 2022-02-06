import { Global as EmotionGlobal } from '@emotion/core'
import { useThemeUI } from 'theme-ui'
import '../fonts'
import './modules.css'

export const Global = ({ ...props }) => {
  const { theme } = useThemeUI() as any

  return (
    <EmotionGlobal styles={theme.global} />
  )
}

export default Global
