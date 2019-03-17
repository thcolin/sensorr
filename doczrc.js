import path from 'path'
import theme from './src/theme'

export default {
  title: '🍿📼 Sensorr',
  modifyBundlerConfig: (config) => {
    // Resolve `src`
    config.resolve.modules.push(path.join(__dirname, 'src'))
    config.module.rules[0].include.push(path.join(__dirname, 'src'))

    // Resolve `doc`
    config.resolve.modules.push(path.join(__dirname, 'doc'))
    config.module.rules[0].include.push(path.join(__dirname, 'doc'))

    // CSS
    config.resolve.extensions.push('.css')

    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    })

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
        `,
        `<script>var config = ${JSON.stringify(require('./config/config.json'))}</script>`,
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
