import path from 'path'
import theme from './src/theme'

export default {
  modifyBundlerConfig: (config) => {
    // Resolve `src`
    config.resolve.modules.push(path.join(__dirname, 'src'))
    config.module.rules[0].include.push(path.join(__dirname, 'src'))

    return config
  },
  htmlContext: {
    head: {
      raw: [
        `
          <style>
            .markdown-table { border: 1px dotted #2D3747; border-collapse: collapse; }
            .markdown-table td, .markdown-table th { border: 1px dotted #2D3747; padding: 10px; }
          </style>
        `
      ]
    }
  },
  themeConfig: {
    mode: 'dark',
    colors: {
      primary: theme.colors.primary,
      link: theme.colors.primary,
    },
    styles: {
      ul: {
        padding: '0 0 0 20px !important',
      }
    },
  },
}
