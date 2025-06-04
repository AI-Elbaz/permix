import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  react: true,
  rules: {
    'node/prefer-global/process': 'off',
    'react/no-use-context': 'off',
  },
  ignores: ['**/.source/**'],
})
