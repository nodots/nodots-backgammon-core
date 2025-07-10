export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calculating bear-off distance using "25 - position" or conditional logic based on player direction. Use point.position[player.direction] instead.',
      recommended: true,
    },
    schema: [],
    messages: {
      noDirectionDistance:
        'Avoid conditional distance calculation. Use point.position[player.direction] (GOLDEN RULE).',
    },
  },
  create(context) {
    function containsDirectionIdentifier(node) {
      if (!node) return false
      switch (node.type) {
        case 'Identifier':
          return (
            node.name === 'direction' ||
            node.name === 'playerDirection' ||
            node.name === 'playerDir'
          )
        case 'MemberExpression':
          return (
            containsDirectionIdentifier(node.object) ||
            (node.property && containsDirectionIdentifier(node.property))
          )
        case 'BinaryExpression':
        case 'LogicalExpression':
          return (
            containsDirectionIdentifier(node.left) ||
            containsDirectionIdentifier(node.right)
          )
        case 'UnaryExpression':
          return containsDirectionIdentifier(node.argument)
        default:
          return false
      }
    }

    function isTwentyFiveMath(expr) {
      return (
        expr &&
        expr.type === 'BinaryExpression' &&
        expr.operator === '-' &&
        ((expr.left.type === 'Literal' && expr.left.value === 25) ||
          (expr.right.type === 'Literal' && expr.right.value === 25))
      )
    }

    return {
      ConditionalExpression(node) {
        if (!containsDirectionIdentifier(node.test)) return
        if (
          isTwentyFiveMath(node.consequent) ||
          isTwentyFiveMath(node.alternate)
        ) {
          context.report({ node, messageId: 'noDirectionDistance' })
        }
      },
    }
  },
}
