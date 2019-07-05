const path = require('path')

// Paths
const paths = {}

paths.root = path.join(__dirname, '..', '..')
paths.config = path.join(paths.root, 'config')
paths.dist = path.join(paths.root, 'dist')
paths.src = path.join(paths.root, 'src')
paths.db = path.join(paths.root, 'config', '.db')
paths.sessions = path.join(paths.root, 'config', '.sessions')

module.exports = {
  paths,
}
