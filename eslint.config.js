import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: true,
    formatters: true,
    rules: {
      'no-console': 0,
      'ts/ban-ts-comment': 0,
      'unused-imports/no-unused-vars': 0,
    },
    ignores: ['src/*', 'README.md'],
  },
)
