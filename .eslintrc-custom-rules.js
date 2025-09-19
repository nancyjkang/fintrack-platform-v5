// Custom ESLint rules to prevent mock data in production
module.exports = {
  rules: {
    'no-mock-data': {
      create(context) {
        return {
          VariableDeclarator(node) {
            if (node.id.name && node.id.name.toLowerCase().includes('mock')) {
              context.report({
                node,
                message: 'Mock data detected. Replace with real API call before production.'
              })
            }
          },
          Property(node) {
            if (node.key.name === 'id' &&
                node.value.type === 'Literal' &&
                typeof node.value.value === 'string' &&
                /^[0-9]+$/.test(node.value.value)) {
              // Check if this looks like hardcoded ID in an array of objects
              const parent = node.parent?.parent
              if (parent?.type === 'ArrayExpression') {
                context.report({
                  node: parent,
                  message: 'Hardcoded data array detected. Consider using API call.'
                })
              }
            }
          },
          Comment(node) {
            if (node.value.toLowerCase().includes('mock') ||
                node.value.toLowerCase().includes('will be replaced')) {
              context.report({
                node,
                message: 'TODO comment about replacing mock data found.'
              })
            }
          }
        }
      }
    }
  }
}


