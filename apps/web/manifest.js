const path = require('path')

module.exports = {
  filename: 'manifest.json',
  fingerprints: false,
  inject: true,
  ios: true,
  theme_color: '#1a1a1a',
  // real manifest data
  short_name: 'Sensorr',
  name: 'Sensorr',
  description: 'Your Friendly Digital Video Recorder 🍿📼',
  background_color: '#1a1a1a',
  orientation: 'portrait',
  display: 'standalone',
  icons: [
    {
      src: path.resolve(__dirname, './src/assets/favicon_256.png'),
      sizes: [120, 152, 167, 192],
      ios: true,
    },
    {
      src: path.resolve(__dirname, './src/assets/favicon_256.png'),
      sizes: [96, 128, 192],
    },
    {
      src: path.resolve(__dirname, './src/assets/favicon_ios.png'),
      size: '180x180',
      ios: true,
    },
    {
      src: path.resolve(__dirname, './src/assets/favicon_256.png'),
      size: '256x256',
    },
    {
      src: path.resolve(__dirname, './src/assets/favicon_384.png'),
      size: '384x384',
    },
    {
      src: path.resolve(__dirname, './src/assets/favicon_512.png'),
      size: '512x512',
    },
    {
      src: path.resolve(__dirname, './src/assets/favicon_1024.png'),
      size: '1024x1024',
      ios: true,
    },
    {
      src: path.resolve(__dirname, './src/assets/favicon_256.png'),
      size: '1024x1024',
      purpose: 'maskable',
    },
  ],
}
