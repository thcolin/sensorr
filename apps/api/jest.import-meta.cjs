const { pathToFileURL } = require('url')

// ts-jest compiles the specs to CommonJS, where import.meta does not exist: like webpack at build time, replace
// import.meta.url with the URL of the file being compiled
module.exports = {
  name: 'import-meta-url',
  version: '1',
  factory: ({ configSet }) => (context) => (sourceFile) => {
    const ts = configSet.compilerModule
    const visit = (node) =>
      ts.isPropertyAccessExpression(node) && ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword && node.name.text === 'url'
        ? ts.factory.createStringLiteral(pathToFileURL(sourceFile.fileName).href)
        : ts.visitEachChild(node, visit, context)
    return ts.visitNode(sourceFile, visit)
  },
}
