import globals from 'globals'
import markdown from '@eslint/markdown'
import prettierConfig from 'eslint-config-prettier'
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended'

export default [
  prettierConfig,
  prettierPluginRecommended,
  {
    files: ['*.js'],
    ignores: ['build/', 'cache/', 'coverage/', 'dist/', 'node_modules/'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
    },
    plugins: {markdown},
    rules: {
      'prettier/prettier': 'error',
    },
  },
  ...markdown.configs.processor,
]
